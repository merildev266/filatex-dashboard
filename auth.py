import sqlite3
import json
import os
import re
import unicodedata
from datetime import datetime, timezone, timedelta

import jwt


DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.db")
SEED_USERS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_users.json")

# Default PIN handed to every new account. The user is forced to change it
# on first login (see must_change_pin). In-network dashboard — simple by design.
DEFAULT_PIN = "0000"

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET manquant. Definissez la variable d'environnement JWT_SECRET "
        "(ex. `export JWT_SECRET=$(python -c \"import secrets; print(secrets.token_urlsafe(64))\")`)"
    )
JWT_EXPIRATION_HOURS = 8

ROLE_HIERARCHY = {"super_admin": 3, "admin": 2, "utilisateur": 1}

# Comptes spéciaux : username = acronyme, pas prenom.nom
# pmo reste en minuscule, DG et CPO en majuscule
SPECIAL_USERNAMES = {"pmo", "CPO", "DG"}

# PINs explicitly blacklisted beyond the sequence/all-same detector below.
_WEAK_PIN_BLACKLIST = {
    "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
    "1234", "4321", "0123", "9876", "2580", "0852", "1212", "2121", "1313", "6969",
    "1004", "2000", "1979", "2024", "2025", "2026",
    "000000", "111111", "222222", "333333", "444444", "555555",
    "666666", "777777", "888888", "999999",
    "123456", "654321", "012345", "987654", "123123", "121212", "123321", "112233",
}


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
    """Validate PIN format: exactly 4 or 6 digits. Raises AuthError on mismatch."""
    if not pin or not re.match(r"^\d{4}$|^\d{6}$", str(pin)):
        raise AuthError("Le code PIN doit contenir 4 ou 6 chiffres")


def _is_weak_pin(pin):
    """Return True if the PIN is trivially guessable.

    Rejects: all-same digits (0000, 1111), strict ascending/descending sequences
    (1234, 9876, 012345), and a small blacklist of common codes.
    """
    s = str(pin)
    if s in _WEAK_PIN_BLACKLIST:
        return True
    if len(set(s)) == 1:  # all same digit
        return True
    if len(s) >= 4:
        diffs = {int(s[i + 1]) - int(s[i]) for i in range(len(s) - 1)}
        if diffs == {1} or diffs == {-1}:
            return True
    return False


def validate_pin_strength(pin):
    """Reject weak PINs. Raises AuthError if the PIN is guessable."""
    if _is_weak_pin(pin):
        raise AuthError(
            "Ce code PIN est trop facile a deviner. Evitez les chiffres identiques "
            "(ex. 0000), les sequences (ex. 1234) et les codes communs."
        )


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
            must_change_pin INTEGER NOT NULL DEFAULT 0,
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
    # Migrations for pre-existing DBs.
    cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "must_change_pin" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN must_change_pin INTEGER NOT NULL DEFAULT 0")
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
    d["must_change_pin"] = bool(d.get("must_change_pin", 0))
    return d


def can_manage(actor_role, target_role):
    """Check if actor_role can manage target_role based on hierarchy."""
    return ROLE_HIERARCHY.get(actor_role, 0) > ROLE_HIERARCHY.get(target_role, 0)


def create_user(first_name, last_name, email, display_name, role, sections, username_override=None):
    """Create a user with the default PIN '0000'. The user is forced to
    change it on first login (must_change_pin=1).

    Returns a dict: {id, username}.
    """
    from flask_bcrypt import generate_password_hash
    username = username_override if username_override else generate_username(first_name, last_name)
    default_hash = generate_password_hash(DEFAULT_PIN).decode("utf-8")
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO users (username, password_hash, display_name, first_name, last_name,
               email, role, sections, pin_set, must_change_pin, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)""",
            (username, default_hash, display_name, first_name.strip(), last_name.strip(),
             email.strip(), role, json.dumps(sections),
             datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        return {"id": cur.lastrowid, "username": username}
    except sqlite3.IntegrityError:
        raise AuthError(f"Le username '{username}' existe deja")
    finally:
        conn.close()


def create_user_with_pin(username, pin, display_name, role, sections,
                         first_name="", last_name="", email=""):
    """Create a user with a specific PIN already set — used by tests.

    The PIN strength check is skipped here because this helper is also used
    to create deliberately weak test accounts. Production code paths go
    through create_user() which uses DEFAULT_PIN + must_change_pin.
    """
    from flask_bcrypt import generate_password_hash
    validate_pin(pin)
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO users (username, password_hash, display_name, first_name, last_name,
               email, role, sections, pin_set, must_change_pin, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)""",
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


def get_user_by_username(username):
    """Case-insensitive lookup so users can type 'dg', 'DG' or 'Dg' and succeed."""
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
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
    """Reset a user's PIN back to the default '0000' and force change on next login."""
    from flask_bcrypt import generate_password_hash
    default_hash = generate_password_hash(DEFAULT_PIN).decode("utf-8")
    conn = _get_conn()
    conn.execute(
        """UPDATE users SET password_hash = ?, pin_set = 1, must_change_pin = 1,
           failed_attempts = 0, locked = 0 WHERE id = ?""",
        (default_hash, user_id)
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

    # Uniform error message for all "login failed" cases to prevent user enumeration.
    # Exception: a lockout is explicitly announced so the user knows to contact an admin.
    GENERIC_ERROR = "Identifiants incorrects"

    user = get_user_by_username(username)

    if user is None:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": GENERIC_ERROR}

    if not user["active"]:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": GENERIC_ERROR}

    if user["locked"]:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": "Compte verrouille apres 5 tentatives. Contactez un administrateur."}

    if not user["pin_set"] or not pin or not check_password_hash(user["password_hash"], pin):
        _increment_failed_attempts(user["id"], user["failed_attempts"])
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": GENERIC_ERROR}

    # Success
    _reset_failed_attempts(user["id"])
    _update_last_login(user["id"])
    _log_login(username, True, user_agent, ip_address)

    token = _generate_token(user)
    return {
        "success": True,
        "must_change_pin": user["must_change_pin"],
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


def update_display_name(user_id, display_name):
    """Update a user's display name only (used for self-service settings)."""
    conn = _get_conn()
    conn.execute("UPDATE users SET display_name = ? WHERE id = ?", (display_name, user_id))
    conn.commit()
    conn.close()


def change_pin(user_id, old_pin, new_pin):
    """Change PIN after verifying the old one.

    Enforces strength on the new PIN (no 0000, 1234, 9876, all-same, etc.)
    Clears must_change_pin on success.
    """
    from flask_bcrypt import check_password_hash, generate_password_hash
    validate_pin(new_pin)
    validate_pin_strength(new_pin)
    user = get_user_by_id(user_id)
    if user is None:
        raise AuthError("Utilisateur introuvable")
    if not check_password_hash(user["password_hash"], old_pin):
        raise AuthError("Code PIN actuel incorrect")
    if check_password_hash(user["password_hash"], new_pin):
        raise AuthError("Le nouveau code PIN doit etre different de l'actuel")
    conn = _get_conn()
    conn.execute(
        """UPDATE users SET password_hash = ?, pin_set = 1, must_change_pin = 0
           WHERE id = ?""",
        (generate_password_hash(new_pin).decode("utf-8"), user_id)
    )
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Seed — default accounts (loaded from seed_users.json, gitignored)
# ---------------------------------------------------------------------------

def _load_seed_users():
    """Return list of dicts from seed_users.json, or [] if the file is absent.

    Expected schema per entry:
      {"first_name": str, "last_name": str, "display_name": str,
       "role": "super_admin"|"admin"|"utilisateur",
       "sections": ["*"] or ["energy", ...],
       "username_override": Optional[str],  // for pmo/DG/CPO
       "email": Optional[str]}
    """
    if not os.path.exists(SEED_USERS_PATH):
        return []
    try:
        with open(SEED_USERS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            return []
        return data
    except (OSError, json.JSONDecodeError):
        return []


def seed_defaults():
    """Create missing default accounts from seed_users.json.

    Idempotent: existing accounts are left untouched — their role, PIN,
    display_name, and activity flags are NEVER overwritten by the seed.
    This prevents the seed from silently rolling back an admin's role change.

    New accounts are created with PIN '0000' + must_change_pin=1 so the user
    is forced to pick their own PIN on first login. The dashboard is deployed
    on a closed network, so a shared default PIN is acceptable.
    """
    seed_users = _load_seed_users()
    if not seed_users:
        return

    conn = _get_conn()
    existing = {r[0].lower() for r in conn.execute("SELECT username FROM users").fetchall()}
    conn.close()

    created = []
    for entry in seed_users:
        try:
            first_name = entry["first_name"]
            last_name = entry["last_name"]
            display_name = entry.get("display_name") or f"{first_name} {last_name}".strip()
            role = entry["role"]
            sections = entry.get("sections") or ["*"]
            username_override = entry.get("username_override") or None
            email = entry.get("email", "")
        except KeyError:
            continue  # malformed entry — skip silently

        username = username_override or generate_username(first_name, last_name)
        if username.lower() in existing:
            continue  # idempotent — never touch existing users

        result = create_user(
            first_name, last_name, email, display_name, role, sections,
            username_override=username_override,
        )
        created.append(result["username"])

    if created:
        print(
            f"[seed] {len(created)} compte(s) cree(s) avec PIN par defaut '{DEFAULT_PIN}' "
            f"(changement force au premier login): {', '.join(created)}",
            flush=True,
        )


# Keep backward compat alias
seed_pmo = seed_defaults
