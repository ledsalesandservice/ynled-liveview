/**
 * camera-relay.js
 * Manages ffmpeg processes: RTSP pull -> RTMP push to local node-media-server.
 * Each camera gets one ffmpeg child process. Restarts on crash with backoff.
 */

const { spawn } = require('child_process');
const { logEvent, setStatus } = require('./db');

const RTMP_BASE = process.env.RTMP_BASE || 'rtmp://127.0.0.1:1935/live';
const MAX_RESTARTS = 999; // effectively unlimited — cameras can go offline temporarily

const activeRelays = new Map(); // cameraId -> { proc, restarts, timer }

function buildFfmpegArgs(rtspUrl, streamKey) {
  // Hikvision cameras output HEVC (H.265) at 2688x1520 via UDP RTSP.
  // NOTE: These cameras do NOT support interleaved TCP RTSP — use UDP (default).
  // Standard RTMP requires H.264, so we transcode with ultrafast preset.
  // -err_detect ignore_err + -fflags +discardcorrupt handle UDP packet loss
  // gracefully instead of crashing the ffmpeg process.
  return [
    '-loglevel', 'warning',
    '-err_detect', 'ignore_err',
    '-fflags', '+discardcorrupt',
    '-i', rtspUrl,
    '-vf', 'scale=1920:1080',
    '-vcodec', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-b:v', '2000k',
    '-maxrate', '2500k',
    '-bufsize', '4000k',
    '-acodec', 'aac',
    '-ar', '44100',
    '-b:a', '128k',
    '-f', 'flv',
    `${RTMP_BASE}/${streamKey}`,
  ];
}

function startRelay(cameraId, rtspUrl, streamKey) {
  if (activeRelays.has(cameraId)) {
    console.log(`[relay] ${cameraId} already running, skipping`);
    return;
  }

  const key = streamKey || cameraId;
  let restarts = 0;

  function launch() {
    console.log(`[relay] starting ${cameraId} -> rtsp=${rtspUrl} key=${key}`);
    const args = buildFfmpegArgs(rtspUrl, key);
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'pipe'] });

    let stderrBuf = '';
    proc.stderr.on('data', d => { stderrBuf += d.toString(); });

    setStatus(cameraId, 'connecting');
    logEvent(cameraId, 'relay_start', `RTSP -> rtmp:${key}`);

    proc.on('exit', (code, signal) => {
      activeRelays.delete(cameraId);
      setStatus(cameraId, 'offline');
      logEvent(cameraId, 'relay_exit', `code=${code} signal=${signal}`);

      if (restarts < MAX_RESTARTS) {
        const delay = Math.min(2000 * 2 ** restarts, 60000);
        restarts++;
        console.log(`[relay] ${cameraId} exited, restart #${restarts} in ${delay}ms`);
        const timer = setTimeout(() => {
          if (!activeRelays.has(cameraId)) launch();
        }, delay);
        activeRelays.set(cameraId, { proc: null, restarts, timer });
      } else {
        console.error(`[relay] ${cameraId} hit max restarts, giving up`);
        logEvent(cameraId, 'relay_failed', 'max restarts reached');
      }
    });

    activeRelays.set(cameraId, { proc, restarts, timer: null });
    // Mark live after 5s if still running (ffmpeg doesn't signal stream-started)
    setTimeout(() => {
      if (activeRelays.has(cameraId) && activeRelays.get(cameraId).proc === proc) {
        setStatus(cameraId, 'live');
        logEvent(cameraId, 'relay_live', `streaming to rtmp:${key}`);
      }
    }, 5000);
  }

  launch();
}

function stopRelay(cameraId) {
  const entry = activeRelays.get(cameraId);
  if (!entry) return;
  if (entry.timer) clearTimeout(entry.timer);
  if (entry.proc) {
    entry.proc.kill('SIGTERM');
    console.log(`[relay] stopped ${cameraId}`);
  }
  activeRelays.delete(cameraId);
  setStatus(cameraId, 'offline');
  logEvent(cameraId, 'relay_stop', 'manual stop');
}

function stopAll() {
  for (const id of activeRelays.keys()) stopRelay(id);
}

function activeList() {
  return [...activeRelays.keys()];
}

module.exports = { startRelay, stopRelay, stopAll, activeList };
