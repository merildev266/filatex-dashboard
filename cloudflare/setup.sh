#!/bin/bash
# ==============================================================
# Filatex Dashboard — Cloudflare Tunnel Setup
# Run this script ONCE to configure the tunnel
# ==============================================================

set -e

TUNNEL_NAME="filatex-dashboard"
CONFIG_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$CONFIG_DIR")"

echo "=== Filatex Dashboard — Cloudflare Tunnel Setup ==="
echo ""

# --- 1. Check cloudflared is installed ---
if ! command -v cloudflared &> /dev/null; then
    echo "[!] cloudflared not found. Installing..."
    echo ""

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Debian/Ubuntu
        if command -v apt &> /dev/null; then
            curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
            echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
            sudo apt update && sudo apt install -y cloudflared
        else
            # Generic Linux
            curl -fsSL -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
            chmod +x cloudflared
            sudo mv cloudflared /usr/local/bin/
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install cloudflared
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "Windows: run 'winget install cloudflare.cloudflared' in PowerShell"
        exit 1
    fi

    echo "[OK] cloudflared installed"
fi

echo "[1/4] cloudflared version: $(cloudflared --version)"

# --- 2. Login to Cloudflare (opens browser) ---
echo ""
echo "[2/4] Logging in to Cloudflare (a browser window will open)..."
cloudflared tunnel login
echo "[OK] Logged in"

# --- 3. Create the tunnel ---
echo ""
echo "[3/4] Creating tunnel '$TUNNEL_NAME'..."
TUNNEL_OUTPUT=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1)
echo "$TUNNEL_OUTPUT"

# Extract tunnel ID
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
    echo "[!] Could not extract tunnel ID. Check if tunnel already exists:"
    echo "    cloudflared tunnel list"
    echo "    Then manually update config.yml with your tunnel ID"
    exit 1
fi

echo "[OK] Tunnel ID: $TUNNEL_ID"

# --- 4. Update config.yml with tunnel ID ---
sed -i "s/TUNNEL_ID_HERE/$TUNNEL_ID/g" "$CONFIG_DIR/config.yml"
echo "[OK] config.yml updated"

# --- 5. DNS route ---
echo ""
echo "[4/4] Setting up DNS..."
echo ""
echo "You have two options:"
echo ""
echo "  Option A — Use your own domain (e.g., dashboard.filatex.com):"
echo "    cloudflared tunnel route dns $TUNNEL_NAME dashboard.filatex.com"
echo ""
echo "  Option B — Use a free Cloudflare subdomain:"
echo "    The tunnel will be available at: https://$TUNNEL_NAME.cfargotunnel.com"
echo "    (No DNS setup needed)"
echo ""
echo "=== Setup complete! ==="
echo ""
echo "To start the dashboard + tunnel, run:"
echo "  cd $PROJECT_DIR"
echo "  ./cloudflare/start.sh"
echo ""
