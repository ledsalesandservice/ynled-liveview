#!/usr/bin/env bash
# start-public.sh — Start YNLED LiveView and expose it publicly via localtunnel
# Usage: bash start-public.sh [optional-subdomain]
#
# The public URL format: https://<subdomain>.loca.lt
# All cameras stream HLS through that URL — shareable from any device anywhere.

set -e

SUBDOMAIN="${1:-ynled-liveview}"
NMS_PORT=8888

echo "=== YNLED LiveView — Public Mode ==="
echo ""

# Kill any existing server
pkill -f "node server.js" 2>/dev/null || true
sleep 1

# Start the relay server in background
echo "[1/2] Starting relay server..."
node "$(dirname "$0")/server.js" > /tmp/ynled-server.log 2>&1 &
SERVER_PID=$!
echo "      Server PID: $SERVER_PID"
sleep 4

# Verify server is up
if ! curl -sf http://localhost:${NMS_PORT}/api/streams > /dev/null; then
  echo "ERROR: Server failed to start. Check /tmp/ynled-server.log"
  exit 1
fi
echo "      Server OK — $(curl -sf http://localhost:${NMS_PORT}/api/streams | python3 -c "import json,sys,os; d=json.load(sys.stdin); print(str(len(d.get('live',{})))+' streams live')" 2>/dev/null || echo 'streams starting')"

# Start localtunnel
echo ""
echo "[2/2] Opening public tunnel (subdomain: ${SUBDOMAIN})..."
echo "      This may take a few seconds..."
echo ""

npx localtunnel --port ${NMS_PORT} --subdomain "${SUBDOMAIN}" 2>/dev/null &
LT_PID=$!

sleep 5

echo "============================================="
echo "  Public URL: https://${SUBDOMAIN}.loca.lt"
echo "  Player:     https://${SUBDOMAIN}.loca.lt/index.html"
echo "  Streams API: https://${SUBDOMAIN}.loca.lt/api/streams"
echo "============================================="
echo ""
echo "Note: First visit requires clicking 'Continue' on the localtunnel page."
echo "Share the Player URL with Derek or any client."
echo ""
echo "Press Ctrl+C to stop everything."

# Wait and clean up
trap "kill $SERVER_PID $LT_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait $LT_PID
