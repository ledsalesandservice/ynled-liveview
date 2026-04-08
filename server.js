/**
 * server.js — YNLED LiveView PoC
 * Starts node-media-server (RTMP + HLS) and a minimal REST API.
 * Load cameras from cameras.json and start RTSP relays automatically.
 */

const NodeMediaServer = require('node-media-server');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const relay = require('./camera-relay');
const { allCameras, recentActivity, upsertCamera } = require('./db');

// ── node-media-server config ──────────────────────────────────────────────────
const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8888,
    allow_origin: '*',
    mediaroot: path.join(__dirname, 'media'),
  },
  trans: {
    ffmpeg: '/usr/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        hlsKeepSegments: 3,
      },
    ],
  },
};

const nms = new NodeMediaServer(nmsConfig);
nms.run();

// ── REST API ──────────────────────────────────────────────────────────────────
function respond(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'GET' && pathname === '/api/cameras') {
    return respond(res, 200, allCameras());
  }

  if (req.method === 'GET' && pathname === '/api/activity') {
    return respond(res, 200, recentActivity(100));
  }

  if (req.method === 'GET' && pathname === '/api/status') {
    return respond(res, 200, {
      active_relays: relay.activeList(),
      cameras: allCameras().length,
      uptime: process.uptime(),
    });
  }

  if (req.method === 'POST' && pathname === '/api/cameras/relay/start') {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      try {
        const { id, rtspUrl, streamKey } = JSON.parse(body);
        if (!id || !rtspUrl) return respond(res, 400, { error: 'id and rtspUrl required' });
        upsertCamera(id, { name: id, rtsp_url: rtspUrl });
        relay.startRelay(id, rtspUrl, streamKey || id);
        return respond(res, 200, { started: id });
      } catch (e) {
        return respond(res, 400, { error: e.message });
      }
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/cameras/relay/stop') {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body);
        if (!id) return respond(res, 400, { error: 'id required' });
        relay.stopRelay(id);
        return respond(res, 200, { stopped: id });
      } catch (e) {
        return respond(res, 400, { error: e.message });
      }
    });
    return;
  }

  respond(res, 404, { error: 'not found' });
});

const API_PORT = process.env.API_PORT || 3001;
server.listen(API_PORT, () => {
  console.log(`[api] listening on http://localhost:${API_PORT}`);
  console.log(`[nms] RTMP on rtmp://localhost:1935/live/<stream-key>`);
  console.log(`[nms] HLS  on http://localhost:8888/live/<stream-key>/index.m3u8`);
  console.log(`[nms] Stats on http://localhost:8888/api/streams`);
  autoLoadCameras();
});

// ── Auto-load cameras.json on startup ────────────────────────────────────────
function autoLoadCameras() {
  const camFile = path.join(__dirname, 'cameras.json');
  if (!fs.existsSync(camFile)) {
    console.log('[cameras] No cameras.json found — start relays manually via API');
    return;
  }
  const cameras = JSON.parse(fs.readFileSync(camFile, 'utf8'));
  console.log(`[cameras] Loading ${cameras.length} camera(s) from cameras.json`);
  for (const cam of cameras) {
    if (cam.rtspUrl) {
      upsertCamera(cam.id, { name: cam.name || cam.id, rtsp_url: cam.rtspUrl });
      relay.startRelay(cam.id, cam.rtspUrl, cam.streamKey || cam.id);
    }
  }
}

process.on('SIGTERM', () => { relay.stopAll(); process.exit(0); });
process.on('SIGINT', () => { relay.stopAll(); process.exit(0); });
