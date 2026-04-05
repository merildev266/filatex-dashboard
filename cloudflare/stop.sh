#!/bin/bash
# ==============================================================
# Filatex Dashboard — Stop all services
# ==============================================================

echo "Stopping Filatex Dashboard..."

# Stop Flask
pkill -f "python app.py" 2>/dev/null && echo "[OK] Flask stopped" || echo "[--] Flask not running"

# Stop cloudflared
pkill -f "cloudflared tunnel" 2>/dev/null && echo "[OK] Tunnel stopped" || echo "[--] Tunnel not running"

echo "Done."
