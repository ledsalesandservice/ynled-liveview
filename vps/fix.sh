#!/usr/bin/env bash
# fix.sh — Run this once on the VPS to fix the dashboard API routing.
# Usage: bash vps/fix.sh
# Must be run as root or with sudo.

set -e

NGINX_CONF="/usr/local/nginx/conf/nginx.conf"
ENV_FILE="/opt/ynled/.env"
DASHBOARD_DIR="/opt/ynled/dashboard"

echo "=== YNLED LiveView — VPS Fix Script ==="

# 1. Point Next.js at Express via localhost (not the external domain)
if [ -f "$ENV_FILE" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" "$ENV_FILE"; then
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://127.0.0.1:3001|" "$ENV_FILE"
        echo "[1/4] Updated NEXT_PUBLIC_API_URL → http://127.0.0.1:3001"
    else
        echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:3001" >> "$ENV_FILE"
        echo "[1/4] Added NEXT_PUBLIC_API_URL=http://127.0.0.1:3001"
    fi

    # Also add API_INTERNAL_URL for server-side use
    if grep -q "API_INTERNAL_URL" "$ENV_FILE"; then
        sed -i "s|API_INTERNAL_URL=.*|API_INTERNAL_URL=http://127.0.0.1:3001|" "$ENV_FILE"
    else
        echo "API_INTERNAL_URL=http://127.0.0.1:3001" >> "$ENV_FILE"
    fi
    echo "[1/4] API_INTERNAL_URL=http://127.0.0.1:3001 set"
else
    echo "[1/4] WARN: $ENV_FILE not found — skipping env update"
fi

# 2. Install corrected nginx.conf (routes /api/v1/ to Express, /api/* to Next.js)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/nginx.conf" ]; then
    cp "$NGINX_CONF" "${NGINX_CONF}.bak.$(date +%s)"
    cp "$SCRIPT_DIR/nginx.conf" "$NGINX_CONF"
    echo "[2/4] Installed corrected nginx.conf (backup saved)"
else
    echo "[2/4] WARN: vps/nginx.conf not found next to this script — applying inline sed fix"
    # Fallback: change /api/ → /api/v1/ in existing config
    sed -i "s|location /api/ {|location /api/v1/ {|g" "$NGINX_CONF"
    echo "[2/4] nginx.conf patched via sed"
fi

# 3. Test and reload nginx
if /usr/local/nginx/sbin/nginx -t; then
    /usr/local/nginx/sbin/nginx -s reload
    echo "[3/4] nginx reloaded"
else
    echo "[3/4] ERROR: nginx config test failed — restoring backup"
    LATEST_BACKUP=$(ls -t "${NGINX_CONF}.bak."* 2>/dev/null | head -1)
    [ -n "$LATEST_BACKUP" ] && cp "$LATEST_BACKUP" "$NGINX_CONF"
    echo "Backup restored. Fix nginx.conf manually."
    exit 1
fi

# 4. Restart Next.js to pick up new env vars
pm2 restart all
pm2 status
echo "[4/4] pm2 restarted"

echo ""
echo "=== Done. Open http://147.93.191.167 — dashboard stats should load. ==="
echo "If still broken, check pm2 logs: pm2 logs liveview-dashboard"
