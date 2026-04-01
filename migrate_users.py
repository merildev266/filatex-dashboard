"""
Migration script: update users table for new role system and PIN-based auth.

Changes:
- Add columns: first_name, last_name, email, pin_set
- Migrate roles: pmo -> super_admin, manager -> utilisateur, directeur -> admin
- Rebuild table with new CHECK constraint
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dashboard.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    # Check if migration already done
    cols = [row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
    if "pin_set" in cols:
        # Check if roles already migrated
        roles = [r[0] for r in conn.execute("SELECT DISTINCT role FROM users").fetchall()]
        if "super_admin" in roles or not roles:
            print("Migration already applied — skipping.")
            conn.close()
            return

    print("Starting migration...")

    # 1. Add new columns if missing (needed before copying data)
    for col, typedef in [
        ("first_name", "TEXT NOT NULL DEFAULT ''"),
        ("last_name", "TEXT NOT NULL DEFAULT ''"),
        ("email", "TEXT NOT NULL DEFAULT ''"),
        ("pin_set", "INTEGER NOT NULL DEFAULT 0"),
    ]:
        if col not in cols:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
            print(f"  Added column: {col}")

    # 2. Mark existing users with passwords as pin_set=1
    conn.execute("UPDATE users SET pin_set = 1 WHERE password_hash != '' AND password_hash IS NOT NULL")
    print("  Marked existing users with passwords as pin_set=1")

    # 3. Rebuild table with new CHECK constraint and migrate roles in one step
    conn.executescript("""
        CREATE TABLE users_new (
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

        INSERT INTO users_new (id, username, password_hash, display_name, first_name,
            last_name, email, role, sections, active, locked, failed_attempts, pin_set,
            created_at, last_login)
        SELECT id, username, COALESCE(password_hash, ''), display_name,
            COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(email, ''),
            CASE
                WHEN role = 'pmo' THEN 'super_admin'
                WHEN role = 'directeur' THEN 'admin'
                WHEN role = 'manager' THEN 'utilisateur'
                ELSE role
            END,
            sections, active, locked, failed_attempts, COALESCE(pin_set, 0),
            created_at, last_login
        FROM users;

        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
    """)
    print("  Rebuilt table with new roles and CHECK constraint")
    print("    pmo -> super_admin, directeur -> admin, manager -> utilisateur")

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    migrate()
