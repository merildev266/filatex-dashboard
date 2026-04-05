#!/bin/bash
# ==============================================================
# Filatex Dashboard — Start Flask + Cloudflare Tunnel
# Run this script to launch the dashboard
# ==============================================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_FILE="$(dirname "$0")/config.yml"
LOG_DIR="$PROJECT_DIR/cloudflare/logs"
mkdir -p "$LOG_DIR"

echo "=== Filatex Dashboard ==="
echo ""

# --- 1. Check config ---
if grep -q "TUNNEL_ID_HERE" "$CONFIG_FILE"; then
    echo "[!] Tunnel not configured. Run setup.sh first:"
    echo "    ./cloudflare/setup.sh"
    exit 1
fi

# --- 2. Optional: refresh data from Excel before starting ---
echo "[1/3] Refreshing data from Excel..."
cd "$PROJECT_DIR"
python generate_data.py 2>/dev/null && echo "  [OK] site_data.js" || echo "  [SKIP] generate_data.py"
python generate_enr_data.py 2>/dev/null && echo "  [OK] enr_site_data.js" || echo "  [SKIP] generate_enr_data.py"
python generate_enr_projects.py 2>/dev/null && echo "  [OK] enr_projects_data.js" || echo "  [SKIP] generate_enr_projects.py"
python generate_hfo_projects.py 2>/dev/null && echo "  [OK] hfo_projects.js" || echo "  [SKIP] generate_hfo_projects.py"
python generate_capex.py 2>/dev/null && echo "  [OK] capex_data.js" || echo "  [SKIP] generate_capex.py"
python generate_reporting.py 2>/dev/null && echo "  [OK] reporting_data.js" || echo "  [SKIP] generate_reporting.py"
echo ""

# --- 3. Start Flask in background ---
echo "[2/3] Starting Flask server on port 5000..."
cd "$PROJECT_DIR"
if command -v gunicorn &> /dev/null; then
    gunicorn -c cloudflare/gunicorn.conf.py app:app &
else
    echo "  [!] gunicorn not found, using Flask dev server (install with: pip install gunicorn)"
    python app.py > "$LOG_DIR/flask.log" 2>&1 &
fi
FLASK_PID=$!
echo "  Flask PID: $FLASK_PID"

# Wait for Flask to be ready
for i in {1..10}; do
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo "  [OK] Flask is running"
        break
    fi
    sleep 1
done

# --- 4. Start Cloudflare Tunnel ---
echo "[3/3] Starting Cloudflare Tunnel..."
echo ""
echo "  Dashboard will be accessible at your configured domain"
echo "  Press Ctrl+C to stop everything"
echo ""

# Trap Ctrl+C to kill Flask too
trap "echo ''; echo 'Shutting down...'; kill $FLASK_PID 2>/dev/null; exit 0" INT TERM

cloudflared tunnel --config "$CONFIG_FILE" run 2>&1 | tee "$LOG_DIR/tunnel.log"

# If tunnel exits, also stop Flask
kill $FLASK_PID 2>/dev/null
