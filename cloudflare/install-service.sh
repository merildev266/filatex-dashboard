#!/bin/bash
# ==============================================================
# Filatex Dashboard — Install as systemd service (Linux)
# Runs automatically on boot, restarts on crash
# ==============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_FILE="$PROJECT_DIR/cloudflare/config.yml"
SERVICE_NAME="filatex-dashboard"
USER=$(whoami)

echo "=== Installing Filatex Dashboard as system service ==="

# --- 1. Create Flask service ---
sudo tee /etc/systemd/system/${SERVICE_NAME}-flask.service > /dev/null <<EOF
[Unit]
Description=Filatex Dashboard Flask Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which gunicorn || echo "gunicorn") -c cloudflare/gunicorn.conf.py app:app
Restart=always
RestartSec=5
Environment=FLASK_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# --- 2. Create Tunnel service ---
sudo tee /etc/systemd/system/${SERVICE_NAME}-tunnel.service > /dev/null <<EOF
[Unit]
Description=Filatex Dashboard Cloudflare Tunnel
After=network-online.target ${SERVICE_NAME}-flask.service
Wants=network-online.target
Requires=${SERVICE_NAME}-flask.service

[Service]
Type=simple
User=$USER
ExecStart=$(which cloudflared) tunnel --config $CONFIG_FILE run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# --- 3. Enable and start ---
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}-flask ${SERVICE_NAME}-tunnel
sudo systemctl start ${SERVICE_NAME}-flask
sleep 2
sudo systemctl start ${SERVICE_NAME}-tunnel

echo ""
echo "[OK] Services installed and started!"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status $SERVICE_NAME-flask    # Check Flask status"
echo "  sudo systemctl status $SERVICE_NAME-tunnel   # Check tunnel status"
echo "  sudo journalctl -u $SERVICE_NAME-flask -f    # View Flask logs"
echo "  sudo journalctl -u $SERVICE_NAME-tunnel -f   # View tunnel logs"
echo "  sudo systemctl restart $SERVICE_NAME-flask   # Restart Flask"
echo "  sudo systemctl restart $SERVICE_NAME-tunnel  # Restart tunnel"
echo ""
