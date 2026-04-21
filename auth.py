import sqlite3
import json
import os
import re
import secrets
import unicodedata
from datetime import datetime, timezone, timedelta

import jwt


DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.db")
SEED_USERS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_users.json")
ACTIVATION_TOKEN_TTL_DAYS = 7

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
            activation_token TEXT NOT NULL DEFAULT '',
            activation_expires_at TEXT,
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
    # Migration: add activation columns to pre-existing DBs that pre-date this feature.
    cols = {r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "activation_token" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN activation_token TEXT NOT NULL DEFAULT ''")
    if "activation_expires_at" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN activation_expires_at TEXT")
    conn.commit()
    conn.close()


def _generate_activation_token():
    """Return (token, expires_at_iso) — fresh 7-day activation token."""
    token = secrets.token_urlsafe(24)
    expires = datetime.now(timezone.utc) + timedelta(days=ACTIVATION_TOKEN_TTL_DAYS)
    return token, expires.isoformat()


def _row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    d["sections"] = json.loads(d["sections"])
    d["active"] = bool(d["active"])
    d["locked"] = bool(d["locked"])
    d["pin_set"] = bool(d.get("pin_set", 0))
    d.setdefault("activation_token", "")
    d.setdefault("activation_expires_at", None)
    return d


def can_manage(actor_role, target_role):
    """Check if actor_role can manage target_role based on hierarchy."""
    return ROLE_HIERARCHY.get(actor_role, 0) > ROLE_HIERARCHY.get(target_role, 0)


def create_user(first_name, last_name, email, display_name, role, sections, username_override=None):
    """Create a user account without PIN.

    Generates an activation token (7-day TTL). The admin must transmit
    the activation link out-of-band (the token is NOT stored in plaintext
    after the user activates — it is cleared on activate).

    Returns a dict: {id, username, activation_token, activation_expires_at}.
    """
    username = username_override if username_override else generate_username(first_name, last_name)
    token, expires = _generate_activation_token()
    conn = _get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO users (username, password_hash, display_name, first_name, last_name,
               email, role, sections, pin_set, activation_token, activation_expires_at, created_at)
               VALUES (?, '', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)""",
            (username, display_name, first_name.strip(), last_name.strip(),
             email.strip(), role, json.dumps(sections), token, expires,
             datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        return {
            "id": cur.lastrowid,
            "username": username,
            "activation_token": token,
            "activation_expires_at": expires,
        }
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
    """Reset PIN — generates a fresh activation token. User must re-activate."""
    token, expires = _generate_activation_token()
    conn = _get_conn()
    conn.execute(
        """UPDATE users SET password_hash = '', pin_set = 0,
           activation_token = ?, activation_expires_at = ? WHERE id = ?""",
        (token, expires, user_id)
    )
    conn.commit()
    conn.close()
    return {"activation_token": token, "activation_expires_at": expires}


def regenerate_activation_token(user_id):
    """Generate a fresh activation token for an unactivated user.

    Refuses to act on users that have already set a PIN — use reset_pin() instead.
    """
    user = get_user_by_id(user_id)
    if user is None:
        raise AuthError("Utilisateur introuvable")
    if user["pin_set"]:
        raise AuthError("Ce compte est deja active. Utilisez reset_pin pour forcer une re-activation.")
    token, expires = _generate_activation_token()
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET activation_token = ?, activation_expires_at = ? WHERE id = ?",
        (token, expires, user_id)
    )
    conn.commit()
    conn.close()
    return {"activation_token": token, "activation_expires_at": expires}


def activate_account(username, token, new_pin):
    """Activate an account using the admin-issued activation token.

    Verifies username + token match and the token hasn't expired, then
    sets the PIN and clears the activation token.
    Raises AuthError on any failure with a generic message (no enumeration).
    """
    from flask_bcrypt import generate_password_hash
    GENERIC = "Lien d'activation invalide ou expire"
    validate_pin(new_pin)  # raises AuthError if PIN is malformed

    user = get_user_by_username(username)
    if user is None or user["pin_set"] or not user["active"]:
        raise AuthError(GENERIC)
    stored = user.get("activation_token") or ""
    if not stored or not secrets.compare_digest(stored, token or ""):
        raise AuthError(GENERIC)
    expires_at = user.get("activation_expires_at")
    if not expires_at:
        raise AuthError(GENERIC)
    try:
        exp = datetime.fromisoformat(expires_at)
    except ValueError:
        raise AuthError(GENERIC)
    if exp < datetime.now(timezone.utc):
        raise AuthError(GENERIC)

    conn = _get_conn()
    conn.execute(
        """UPDATE users SET password_hash = ?, pin_set = 1,
           activation_token = '', activation_expires_at = NULL,
           failed_attempts = 0, locked = 0 WHERE id = ?""",
        (generate_password_hash(new_pin).decode("utf-8"), user["id"])
    )
    conn.commit()
    conn.close()
    return get_user_by_id(user["id"])


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

    # Activation (pin_set=0) is no longer automatic on login — a user with no PIN
    # must go through the dedicated activation flow (admin-generated token).
    # See /api/auth/activate. Empty-PIN or unknown-PIN attempts fall through to
    # the generic error message below to avoid leaking account state.
    if not user["pin_set"]:
        _log_login(username, False, user_agent, ip_address)
        return {"success": False, "error": GENERIC_ERROR}

    if not pin or not check_password_hash(user["password_hash"], pin):
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


def update_display_name(user_id, display_name):
    """Update a user's display name only (used for self-service settings)."""
    conn = _get_conn()
    conn.execute("UPDATE users SET display_name = ? WHERE id = ?", (display_name, user_id))
    conn.commit()
    conn.close()


def change_pin(user_id, old_pin, new_pin):
    """Change PIN after verifying the old one. Raises AuthError on failure."""
    from flask_bcrypt import check_password_hash, generate_password_hash
    validate_pin(new_pin)
    user = get_user_by_id(user_id)
    if user is None:
        raise AuthError("Utilisateur introuvable")
    if user["pin_set"] and not check_password_hash(user["password_hash"], old_pin):
        raise AuthError("Code PIN actuel incorrect")
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET password_hash = ?, pin_set = 1 WHERE id = ?",
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

    Newly-created accounts are unactivated (no PIN) and receive a 7-day
    activation token. The token is printed to stdout so an operator running
    the server on bare metal can copy the activation URL for bootstrap users.
    """
    seed_users = _load_seed_users()
    if not seed_users:
        return

    conn = _get_conn()
    existing = {r[0].lower() for r in conn.execute("SELECT username FROM users").fetchall()}
    conn.close()

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
        # Print activation URL to stdout so an operator can copy it at startup.
        # Stored token is also retrievable by an admin via /api/admin/users.
        print(
            f"[seed] Compte cree: {result['username']} (role={role}) — "
            f"token d'activation: {result['activation_token']} "
            f"(expire {result['activation_expires_at']})",
            flush=True,
        )


# Keep backward compat alias
seed_pmo = seed_defaults
