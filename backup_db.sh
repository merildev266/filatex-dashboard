#!/bin/bash
#
# Backup quotidien de dashboard.db (comptes users, PINs hashes, historique, chat, notifs).
# A planifier via cron :
#   0 2 * * * /home/user/filatex-dashboard/backup_db.sh >> /var/log/filatex-backup.log 2>&1
#
# Garde les 30 derniers backups quotidiens.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="$SCRIPT_DIR/dashboard.db"
BACKUP_DIR="$SCRIPT_DIR/backups"
RETENTION=30

if [[ ! -f "$DB" ]]; then
    echo "[$(date -Iseconds)] ERROR: database not found at $DB"
    exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
DEST="$BACKUP_DIR/dashboard-$STAMP.db"

# Use SQLite .backup API (safe for live databases, respects locks).
# Prefer sqlite3 CLI if available, fallback to Python (always available here).
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DB" ".backup '$DEST'"
    INTEGRITY=$(sqlite3 "$DEST" "PRAGMA integrity_check;")
else
    python3 - "$DB" "$DEST" <<'PY'
import sqlite3, sys
src = sqlite3.connect(sys.argv[1])
dst = sqlite3.connect(sys.argv[2])
with dst:
    src.backup(dst)
src.close(); dst.close()
PY
    INTEGRITY=$(python3 -c "import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); print(c.execute('PRAGMA integrity_check').fetchone()[0])" "$DEST")
fi

if [[ "$INTEGRITY" != "ok" ]]; then
    echo "[$(date -Iseconds)] ERROR: backup integrity check failed for $DEST (got: $INTEGRITY)"
    rm -f "$DEST"
    exit 2
fi

# Retention : keep last N, delete older ones
cd "$BACKUP_DIR"
ls -1t dashboard-*.db 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm --

SIZE=$(du -h "$DEST" | cut -f1)
echo "[$(date -Iseconds)] Backup OK : $DEST ($SIZE)"
