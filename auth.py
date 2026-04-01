import sqlite3
import json
import os
import re
import unicodedata
from datetime import datetime, timezone, timedelta

import jwt


DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.db")

JWT_SECRET = os.environ.get("JWT_SECRET", "filatex-dashboard-secret-change-me")
JWT_EXPIRATION_HOURS = 8

ROLE_HIERARCHY = {"super_admin": 3, "admin": 2, "utilisateur": 1}


class AuthError(Exception):
    pass


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _strip_accents(text):
    """Remove accents from text for username generation."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def generate_username(first_name, last_name):
    """Generate username as prenom.nom in lowercase without accents."""
    fn = _strip_accents(first_name.strip()).lower().replace(" ", "")
    ln = _strip_accents(last_name.strip()).lower().replace(" ", "")
    return f"{fn}.{ln}"


def validate_pin(pin):
    """Validate that PIN is exactly 4 or 6 digits."""
    if not pin or not re.match(r"^\d{4}$|^\d{6}$", str(pin)):
        raise AuthError("Le code PIN doit contenir 4 ou 6 chiffres")


def init_db():
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL DEFAULT '',
            display_name TEXT NOT NULL,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            email TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin', 'utilisateur')),
            sections TEXT NOT NULL DEFAULT '[]',
            active INTEGER NOT NULL DEFAULT 1,
            locked INTEGER NOT NULL DEFAULT 0,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            pin_set INTEGER NOT NULL DEFAULT 0,
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
    d["pin_set"] = bool(d.get("pin_set", 0))
    return d


def can_manage(actor_role, target_role):
    """Check if actor_role can manage target_role based on hierarchy."""
    return ROLE_HIERARCHY.get(actor_role, 0) > ROLE_HIERARCHY.get(target_role, 0)


def create_user(first_name, last_name, email, display_name, role, sections):
    """Create a user account without PIN — user sets PIN on first login."""
    username = generate_username(first_name, last_name)
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO users (username, password_hash, display_name, first_name, last_name,
               email, role, sections, pin_set, created_at)
               VALUES (?, '', ?, ?, ?, ?, ?, ?, 0, ?)""",
            (username, display_name, first_name.strip(), last_name.strip(),
             email.strip(), role, json.dumps(sections),
             datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        raise AuthError(f"Le username '{username}' existe deja")
    finally:
        conn.close()


def create_user_with_pin(username, pin, display_name, role, sections,
                         first_name="", last_name="", email=""):
    """Create a user with PIN already set (used for seed / migration)."""
    from flask_bcrypt import generate_password_hash
    validate_pin(pin)
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO users (username, password_hash, display_name, first_name, last_name,
               email, role, sections, pin_set, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
            (username, generate_password_hash(pin).decode("utf-8"),
             display_name, first_name, last_name, email, role, json.dumps(sections),
             datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        raise AuthError(f"Le username '{username}' existe deja")
    finally:
        conn.close()


def set_pin(username, pin):
    """Set or change PIN for a user (first login flow)."""
    from flask_bcrypt import generate_password_hash
    validate_pin(pin)
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET password_hash = ?, pin_set = 1 WHERE username = ?",
        (generate_password_hash(pin).decode("utf-8"), username)
    )
    conn.commit()
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


def update_user(user_id, display_name=None, role=None, sections=None, active=None,
                first_name=None, last_name=None, email=None):
    conn = _get_conn()
    fields = []
    values = []
    if display_name is not None:
        fields.append("display_name = ?")
        values.append(display_name)
    if first_name is not None:
        fields.append("first_name = ?")
        values.append(first_name)
    if last_name is not None:
        fields.append("last_name = ?")
        values.append(last_name)
    if email is not None:
        fields.append("email = ?")
        values.append(email)
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


def reset_pin(user_id):
    """Reset PIN — forces user to set a new PIN on next login."""
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET password_hash = '', pin_set = 0 WHERE id = ?",
        (user_id,)
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

def authenticate(username, pin, user_agent="", ip_address=""):
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
        return {"success": False, "error": "Compte verrouille apres 5 tentatives. Contactez un administrateur."}

    # User has no PIN yet — must set one on first login
    if not user["pin_set"]:
        _log_login(username, True, user_agent, ip_address)
        temp_token = _generate_token(user)
        return {
            "success": True,
            "must_set_pin": True,
            "token": temp_token,
            "user": {
                "username": user["username"],
                "display_name": user["display_name"],
                "role": user["role"],
                "sections": user["sections"],
            }
        }

    if not check_password_hash(user["password_hash"], pin):
        _increment_failed_attempts(user["id"], user["failed_attempts"])
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": "Code PIN incorrect"}

    # Success
    _reset_failed_attempts(user["id"])
    _update_last_login(user["id"])
    _log_login(username, True, user_agent, ip_address)

    token = _generate_token(user)
    return {
        "success": True,
        "must_set_pin": False,
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
    """Create the default super_admin account if no users exist."""
    conn = _get_conn()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    if count == 0:
        create_user_with_pin("pmo", "2618", "PMO", "super_admin", ["*"])
