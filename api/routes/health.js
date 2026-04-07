const express = require('express');
const os = require('os');
const { execSync } = require('child_process');
const db = require('../db');

const router = express.Router();

// GET /health — VPS health check
router.get('/', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const uptimeSeconds = os.uptime();

  // Count active streams
  const liveCount = db.prepare("SELECT COUNT(*) as count FROM cameras WHERE status = 'live'").get().count;
  const connectingCount = db.prepare("SELECT COUNT(*) as count FROM cameras WHERE status = 'connecting'").get().count;

  // Get CPU load average (1-minute)
  const loadAvg = os.loadavg();
  const cpuCount = cpus.length;
  const cpuUsagePct = Math.min(Math.round((loadAvg[0] / cpuCount) * 100), 100);

  let nginxStatus = 'unknown';
  try {
    execSync('systemctl is-active nginx-rtmp 2>/dev/null || systemctl is-active nginx 2>/dev/null');
    nginxStatus = 'running';
  } catch {
    nginxStatus = 'stopped';
  }

  let ehomeStatus = 'unknown';
  try {
    execSync('systemctl is-active ehome-listener 2>/dev/null');
    ehomeStatus = 'running';
  } catch {
    ehomeStatus = 'stopped';
  }

  res.json({
    status: 'ok',
    uptime_seconds: uptimeSeconds,
    cpu: {
      cores: cpuCount,
      load_1m: loadAvg[0].toFixed(2),
      usage_pct: cpuUsagePct
    },
    memory: {
      total_mb: Math.round(totalMem / 1024 / 1024),
      used_mb: Math.round(usedMem / 1024 / 1024),
      free_mb: Math.round(freeMem / 1024 / 1024),
      usage_pct: Math.round((usedMem / totalMem) * 100)
    },
    streams: {
      live: liveCount,
      connecting: connectingCount
    },
    services: {
      nginx_rtmp: nginxStatus,
      ehome_listener: ehomeStatus
    }
  });
});

module.exports = router;
