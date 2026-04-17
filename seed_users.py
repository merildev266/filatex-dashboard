"""
Import users from a CSV file into dashboard.db.

Usage :
    python seed_users.py users.csv
    python seed_users.py users.csv --dry-run       # preview only, no DB write
    python seed_users.py users.csv --update        # update existing users instead of skipping

CSV columns : first_name, last_name, display_name, role, access, email
  - role   : super_admin | admin | utilisateur
  - access : full | energy | properties | capex | investments | reporting | csi
             (or comma-separated : "energy,reporting")
Lines starting with # are ignored (comments).

Users are created WITHOUT a PIN — each user sets it on first login.
"""
import csv
import sys
import argparse

import auth


ACCESS_MAP = {
    "full": ["*"],
    "energy": ["energy"],
    "properties": ["properties"],
    "capex": ["capex"],
    "investments": ["investments"],
    "reporting": ["reporting"],
    "csi": ["csi"],
}

VALID_ROLES = {"super_admin", "admin", "utilisateur"}


def parse_access(raw):
    """'full' -> ['*'] ; 'energy,reporting' -> ['energy', 'reporting']."""
    raw = (raw or "").strip().lower()
    if not raw:
        raise ValueError("access is empty")
    if "," in raw:
        items = [a.strip() for a in raw.split(",") if a.strip()]
        return [ACCESS_MAP[a][0] if a in ACCESS_MAP else a for a in items]
    if raw in ACCESS_MAP:
        return ACCESS_MAP[raw]
    # Accept raw section ids as well (energy.hfo, capex.enr...)
    return [raw]


def main():
    parser = argparse.ArgumentParser(description="Seed users from CSV into dashboard.db")
    parser.add_argument("csv_file", help="Path to users CSV file")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no DB write")
    parser.add_argument("--update", action="store_true", help="Update existing users instead of skipping")
    args = parser.parse_args()

    auth.init_db()

    created, updated, skipped, errors = 0, 0, 0, []

    with open(args.csv_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader((line for line in f if not line.lstrip().startswith("#")))
        if not reader.fieldnames:
            print("ERROR: CSV appears empty or has no header row")
            sys.exit(1)

        expected = {"first_name", "last_name", "role", "access"}
        missing = expected - set(reader.fieldnames)
        if missing:
            print(f"ERROR: missing columns in CSV: {sorted(missing)}")
            sys.exit(1)

        for lineno, row in enumerate(reader, start=2):
            try:
                first = (row.get("first_name") or "").strip()
                last = (row.get("last_name") or "").strip()
                if not first or not last:
                    continue  # blank line
                display = (row.get("display_name") or "").strip() or f"{first} {last}".upper()
                role = (row.get("role") or "utilisateur").strip().lower()
                if role not in VALID_ROLES:
                    raise ValueError(f"invalid role '{role}' (must be {sorted(VALID_ROLES)})")
                sections = parse_access(row.get("access", ""))
                email = (row.get("email") or "").strip()
                username = auth.generate_username(first, last)

                existing = auth.get_user_by_username(username)
                if existing and not args.update:
                    skipped += 1
                    print(f"  [skip]   {username}  (already exists)")
                    continue

                if args.dry_run:
                    action = "update" if existing else "create"
                    print(f"  [DRY {action}] {username} | {display} | {role} | {sections}")
                    continue

                if existing:
                    auth.update_user(
                        existing["id"],
                        display_name=display,
                        first_name=first,
                        last_name=last,
                        email=email,
                        role=role,
                        sections=sections,
                    )
                    updated += 1
                    print(f"  [update] {username}")
                else:
                    auth.create_user(first, last, email, display, role, sections)
                    created += 1
                    print(f"  [create] {username}  ({role}, {sections})")

            except auth.AuthError as e:
                errors.append(f"line {lineno}: {e}")
            except Exception as e:
                errors.append(f"line {lineno}: {e}")

    print()
    print(f"Summary : {created} created, {updated} updated, {skipped} skipped, {len(errors)} errors")
    if errors:
        for err in errors:
            print(f"  ! {err}")
        sys.exit(2)


if __name__ == "__main__":
    main()
