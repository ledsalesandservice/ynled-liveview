# YNLED LiveView — Local PoC

Test the full camera → RTMP → HLS pipeline on the Ubuntu laptop before moving to VPS.

## What's in this repo

| File | Purpose |
|---|---|
| `server.js` | Main process — starts node-media-server (RTMP + HLS) + REST API |
| `camera-relay.js` | Manages ffmpeg RTSP pull → RTMP push processes per camera |
| `ehome-listener/server.js` | TCP listener on port 7660 for Hikvision EHome v4.0 registration |
| `db.js` | SQLite helpers (camera status, activity log) |
| `cameras.json` | Camera list — edit this to add cameras |
| `test-poc.sh` | Synthetic test — verifies pipeline without a real camera |

## Quick Start

```bash
cd /home/nemo/ynled-liveview

# Install dependencies (one time)
npm install

# Start the server
npm start
```

Server starts:
- **RTMP** on `rtmp://localhost:1935/live/<stream-key>`
- **HLS** on `http://localhost:8888/live/<stream-key>/index.m3u8`
- **REST API** on `http://localhost:3001`
- **EHome TCP** on port `7660` (in server.js — integrate with `ehome-listener/server.js` if needed)

## Test with a Synthetic Source (no camera needed)

```bash
# In terminal 1
npm start

# In terminal 2
bash test-poc.sh test-stream
```

Then open the HLS stream in VLC or browser:
`http://localhost:8888/live/test-stream/index.m3u8`

## Test with a Real Hikvision Camera

### Step 1 — Edit cameras.json

Replace `CAMERA_IP` with the camera's actual IP address on your network:

```json
[
  {
    "id": "YNLED0001",
    "name": "Camera 1",
    "rtspUrl": "rtsp://admin:Landes66!@192.168.1.50:554/Streaming/Channels/101",
    "streamKey": "YNLED0001"
  }
]
```

### Step 2 — Find camera IP with SADP

Use Hikvision SADP Tool (or check your router's DHCP table) to find the camera IP.

### Step 3 — Start server

```bash
npm start
```

The relay starts automatically. Watch for:
```
[relay] starting YNLED0001 -> rtsp=rtsp://admin:...@192.168.1.50:554/...
[relay] YNLED0001 now live
```

### Step 4 — Watch the stream

VLC: `http://localhost:8888/live/YNLED0001/index.m3u8`

Or embed in browser:
```html
<video controls>
  <source src="http://localhost:8888/live/YNLED0001/index.m3u8" type="application/x-mpegURL">
</video>
```

## EHome Registration (Push mode — camera calls your server)

Once cameras are on the same network and you want to test EHome push instead of RTSP pull:

### On the camera (Hikvision web interface)

1. `Configuration → Network → Advanced Settings → Platform Access`
2. Set **Platform Access Mode** to `EHome`
3. Set **Server Address** to your laptop's local IP (e.g. `192.168.1.100`)
4. Set **Port** to `7660`
5. Set **Account/Device ID** to `YNLED0001` (or your chosen ID)
6. Save

### Start EHome listener

```bash
# Standalone (for testing)
node ehome-listener/server.js

# Or integrate it into server.js (see note in server.js)
```

Watch for:
```
[ehome] REGISTERED device=YNLED0001 ip=192.168.1.50
```

The listener will automatically trigger the RTSP relay when a camera registers
(if `rtsp_url` is set in cameras.json for that device ID).

## REST API

| Endpoint | Description |
|---|---|
| `GET /api/status` | Server uptime, active relay count |
| `GET /api/cameras` | All cameras with status |
| `GET /api/activity` | Last 100 events |
| `POST /api/cameras/relay/start` | `{"id":"YNLED0001","rtspUrl":"rtsp://...","streamKey":"YNLED0001"}` |
| `POST /api/cameras/relay/stop` | `{"id":"YNLED0001"}` |

## Add a Camera via API (without editing cameras.json)

```bash
curl -X POST http://localhost:3001/api/cameras/relay/start \
  -H "Content-Type: application/json" \
  -d '{
    "id": "YNLED0002",
    "rtspUrl": "rtsp://admin:Landes66!@192.168.1.51:554/Streaming/Channels/101",
    "streamKey": "YNLED0002"
  }'
```

## Relay to YouTube (when ready)

Change the RTMP target from local to YouTube:

```bash
RTMP_BASE="rtmp://a.rtmp.youtube.com/live2" npm start
```

Stream key is the YouTube stream key you get from YouTube Studio.
Each camera needs its own YouTube stream key.

## Next Steps (Phase 2)

- Add authentication to REST API
- Deploy to VPS (Ubuntu 24.04) with nginx-rtmp compiled from source
- Add full SQLite schema (clients, billing)
- Connect to Next.js dashboard (Phase 3)
