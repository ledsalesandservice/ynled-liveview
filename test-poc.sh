#!/usr/bin/env bash
# test-poc.sh — YNLED LiveView PoC test script
# Tests the full relay pipeline using a synthetic ffmpeg source.
# Run AFTER `npm start` is up.

set -e

RTMP_BASE="${RTMP_BASE:-rtmp://127.0.0.1:1935/live}"
STREAM_KEY="${1:-test-stream}"
API_BASE="${API_BASE:-http://localhost:3001}"
NMS_API="${NMS_API:-http://localhost:8888/api/streams}"

echo "=== YNLED LiveView PoC Test ==="
echo "RTMP target: ${RTMP_BASE}/${STREAM_KEY}"
echo ""

# Check server is up
echo "[1/4] Checking API health..."
curl -sf "${API_BASE}/api/status" | python3 -m json.tool || {
  echo "ERROR: API not responding. Run 'npm start' first."
  exit 1
}

echo ""
echo "[2/4] Starting synthetic test stream (10 seconds)..."
echo "      Stream key: ${STREAM_KEY}"
echo "      HLS preview: http://localhost:8888/live/${STREAM_KEY}/index.m3u8"
echo ""

# Push a test pattern + tone for 10 seconds
ffmpeg -loglevel warning \
  -f lavfi -i "testsrc=size=1280x720:rate=25" \
  -f lavfi -i "sine=frequency=440:sample_rate=44100" \
  -t 10 \
  -vcodec libx264 -preset ultrafast -tune zerolatency -b:v 1000k \
  -acodec aac -ar 44100 -b:a 128k \
  -f flv "${RTMP_BASE}/${STREAM_KEY}" &

FFMPEG_PID=$!
echo "[2/4] ffmpeg PID: ${FFMPEG_PID}"

# Wait a moment then check NMS streams API
sleep 3
echo ""
echo "[3/4] Checking node-media-server streams..."
curl -sf "${NMS_API}" | python3 -m json.tool 2>/dev/null || echo "(no streams yet — ffmpeg may still be connecting)"

# Wait for ffmpeg to finish
wait $FFMPEG_PID 2>/dev/null || true

echo ""
echo "[4/4] Test complete."
echo ""
echo "Results:"
echo "  - If NMS showed a stream in step 3, the pipeline works."
echo "  - HLS file should exist: $(ls media/live/${STREAM_KEY}/*.m3u8 2>/dev/null || echo 'not found — check NMS trans config')"
echo ""
echo "To test with a real Hikvision camera:"
echo "  1. Edit cameras.json — replace CAMERA_IP with actual IP"
echo "  2. Restart: npm start"
echo "  3. Check HLS: http://localhost:8888/live/YNLED0001/index.m3u8"
echo ""
echo "To test EHome registration (once camera is configured):"
echo "  - Set camera Platform Access: server=<this machine IP>, port=7660"
echo "  - Camera will connect and register its device ID"
echo "  - Watch: node ehome-listener/server.js"
