const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'liveview.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT DEFAULT '',
    rtsp_url TEXT,
    yt_key TEXT,
    destination TEXT DEFAULT 'local',
    status TEXT DEFAULT 'offline',
    last_seen DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    camera_id TEXT,
    event TEXT NOT NULL,
    message TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function logEvent(cameraId, event, message, ipAddress) {
  db.prepare(`
    INSERT INTO activity_log (camera_id, event, message, ip_address)
    VALUES (?, ?, ?, ?)
  `).run(cameraId, event, message || null, ipAddress || null);
  console.log(`[DB] ${event} | camera=${cameraId} | ${message || ''}`);
}

function upsertCamera(id, fields) {
  const existing = db.prepare('SELECT id FROM cameras WHERE id = ?').get(id);
  if (existing) {
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE cameras SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
  } else {
    db.prepare(`
      INSERT INTO cameras (id, name, client, rtsp_url, status)
      VALUES (?, ?, '', ?, 'offline')
    `).run(id, fields.name || id, fields.rtsp_url || null);
  }
}

function setStatus(cameraId, status) {
  db.prepare(`UPDATE cameras SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(status, cameraId);
}

function allCameras() {
  return db.prepare('SELECT * FROM cameras ORDER BY created_at DESC').all();
}

function recentActivity(limit = 50) {
  return db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?').all(limit);
}

module.exports = { db, logEvent, upsertCamera, setStatus, allCameras, recentActivity };
