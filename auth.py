import sqlite3
import json
import os
from datetime import datetime, timezone, timedelta

import jwt


DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.db")

JWT_SECRET = os.environ.get("JWT_SECRET", "filatex-dashboard-secret-change-me")
JWT_EXPIRATION_HOURS = 8


class AuthError(Exception):
    pass


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('pmo', 'directeur', 'manager')),
            sections TEXT NOT NULL DEFAULT '[]',
            active INTEGER NOT NULL DEFAULT 1,
            locked INTEGER NOT NULL DEFAULT 0,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            last_login TEXT
        );
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            success INTEGER NOT NULL,
            user_agent TEXT,
            ip_address TEXT
        );
    """)
    conn.commit()
    conn.close()


def _row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    d["sections"] = json.loads(d["sections"])
    d["active"] = bool(d["active"])
    d["locked"] = bool(d["locked"])
    return d


def create_user(username, password, display_name, role, sections):
    from flask_bcrypt import generate_password_hash
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO users (username, password_hash, display_name, role, sections, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (username, generate_password_hash(password).decode("utf-8"),
             display_name, role, json.dumps(sections),
             datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        raise AuthError(f"Le username '{username}' existe deja")
    finally:
        conn.close()


def get_user_by_username(username):
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return _row_to_dict(row)


def get_user_by_id(user_id):
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return _row_to_dict(row)


def get_all_users():
    conn = _get_conn()
    rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def update_user(user_id, display_name=None, role=None, sections=None, active=None):
    conn = _get_conn()
    fields = []
    values = []
    if display_name is not None:
        fields.append("display_name = ?")
        values.append(display_name)
    if role is not None:
        fields.append("role = ?")
        values.append(role)
    if sections is not None:
        fields.append("sections = ?")
        values.append(json.dumps(sections))
    if active is not None:
        fields.append("active = ?")
        values.append(int(active))
    if not fields:
        conn.close()
        return
    values.append(user_id)
    conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    conn.close()


def delete_user(user_id):
    conn = _get_conn()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


def reset_password(user_id, new_password):
    from flask_bcrypt import generate_password_hash
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (generate_password_hash(new_password).decode("utf-8"), user_id)
    )
    conn.commit()
    conn.close()


def unlock_user(user_id):
    conn = _get_conn()
    conn.execute("UPDATE users SET locked = 0, failed_attempts = 0 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


def toggle_active(user_id):
    conn = _get_conn()
    conn.execute("UPDATE users SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Authentication — login, JWT, lockout, history
# ---------------------------------------------------------------------------

def authenticate(username, password, user_agent="", ip_address=""):
    from flask_bcrypt import check_password_hash

    user = get_user_by_username(username)

    if user is None:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": "Identifiants incorrects"}

    if not user["active"]:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": "Compte desactive"}

    if user["locked"]:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": "Compte verrouille apres 5 tentatives. Contactez le PMO."}

    if not check_password_hash(user["password_hash"], password):
        _increment_failed_attempts(user["id"], user["failed_attempts"])
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": "Identifiants incorrects"}

    # Success
    _reset_failed_attempts(user["id"])
    _update_last_login(user["id"])
    _log_login(username, True, user_agent, ip_address)

    token = _generate_token(user)
    return {
        "success": True,
        "token": token,
        "user": {
            "username": user["username"],
            "display_name": user["display_name"],
            "role": user["role"],
            "sections": user["sections"],
        }
    }


def _generate_token(user):
    payload = {
        "username": user["username"],
        "display_name": user["display_name"],
        "role": user["role"],
        "sections": user["sections"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def _increment_failed_attempts(user_id, current_attempts):
    conn = _get_conn()
    new_count = current_attempts + 1
    locked = 1 if new_count >= 5 else 0
    conn.execute(
        "UPDATE users SET failed_attempts = ?, locked = ? WHERE id = ?",
        (new_count, locked, user_id)
    )
    conn.commit()
    conn.close()


def _reset_failed_attempts(user_id):
    conn = _get_conn()
    conn.execute("UPDATE users SET failed_attempts = 0 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


def _update_last_login(user_id):
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET last_login = ? WHERE id = ?",
        (datetime.now(timezone.utc).isoformat(), user_id)
    )
    conn.commit()
    conn.close()


def _log_login(username, success, user_agent, ip_address):
    conn = _get_conn()
    conn.execute(
        "INSERT INTO login_history (username, timestamp, success, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)",
        (username, datetime.now(timezone.utc).isoformat(), int(success), user_agent, ip_address)
    )
    conn.commit()
    conn.close()


def get_login_history(username=None, limit=100):
    conn = _get_conn()
    if username:
        rows = conn.execute(
            "SELECT * FROM login_history WHERE username = ? ORDER BY timestamp DESC LIMIT ?",
            (username, limit)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM login_history ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        ).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["success"] = bool(d["success"])
        result.append(d)
    return result


def seed_pmo():
    """Create the default PMO account if no users exist."""
    conn = _get_conn()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    if count == 0:
        create_user("pmo", "filatex2026", "PMO", "pmo", ["*"])
