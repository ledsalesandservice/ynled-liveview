#!/usr/bin/env bash
# start-public.sh — Start YNLED LiveView and expose it publicly via Cloudflare Quick Tunnel
# Usage: bash start-public.sh
#
# Generates a random *.trycloudflare.com URL — no account needed.
# The URL changes each run. For a permanent URL, deploy to VPS or use Cloudflare Tunnel with account.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NMS_PORT=8888
CF_LOG=/tmp/ynled-cf.log
SERVER_LOG=/tmp/ynled-server.log

echo "=== YNLED LiveView — Public Mode ==="
echo ""

# Kill any existing processes on required ports
for PORT in $NMS_PORT 3001 1935; do
  fuser -k ${PORT}/tcp 2>/dev/null || true
done
sleep 1

# Start the relay server
echo "[1/2] Starting relay server..."
node "${SCRIPT_DIR}/server.js" > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "      PID: $SERVER_PID — log: $SERVER_LOG"

# Wait for server to be ready
for i in $(seq 1 10); do
  if curl -sf "http://localhost:${NMS_PORT}/api/streams" > /dev/null 2>&1; then break; fi
  sleep 1
done
if ! curl -sf "http://localhost:${NMS_PORT}/api/streams" > /dev/null 2>&1; then
  echo "ERROR: Server failed to start. Check $SERVER_LOG"
  exit 1
fi
LIVE=$(curl -sf "http://localhost:${NMS_PORT}/api/streams" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('live',{})))" 2>/dev/null || echo '?')
echo "      Server OK — ${LIVE} cameras streaming"

# Start Cloudflare quick tunnel
echo ""
echo "[2/2] Opening Cloudflare tunnel..."

# Use bundled cloudflared if available, else system
CF_BIN="${SCRIPT_DIR}/cloudflared"
[ ! -x "$CF_BIN" ] && CF_BIN="$(which cloudflared 2>/dev/null || echo '')"
if [ -z "$CF_BIN" ]; then
  echo "ERROR: cloudflared not found. Download from https://github.com/cloudflare/cloudflared/releases"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

"$CF_BIN" tunnel --url "http://localhost:${NMS_PORT}" --no-autoupdate > "$CF_LOG" 2>&1 &
CF_PID=$!

# Extract URL from log
PUBLIC_URL=""
for i in $(seq 1 20); do
  PUBLIC_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | head -1)
  [ -n "$PUBLIC_URL" ] && break
  sleep 2
done

if [ -z "$PUBLIC_URL" ]; then
  echo "ERROR: Could not get public URL. Check $CF_LOG"
  kill $SERVER_PID $CF_PID 2>/dev/null
  exit 1
fi

echo ""
echo "============================================="
echo "  LIVE VIEWER:  ${PUBLIC_URL}/index.html"
echo "  STREAMS API:  ${PUBLIC_URL}/api/streams"
echo "============================================="
echo ""
echo "Share the LIVE VIEWER URL — works on any device, anywhere."
echo "URL is valid until you stop this script (Ctrl+C)."
echo ""
echo "Cameras live: ${LIVE}"
echo ""

trap "echo ''; echo 'Stopping...'; kill $SERVER_PID $CF_PID 2>/dev/null; echo 'Done.'" EXIT INT TERM
wait $CF_PID
