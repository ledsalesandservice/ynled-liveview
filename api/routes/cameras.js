const express = require('express');
const { execSync } = require('child_process');
const db = require('../db');

const router = express.Router();

// GET /cameras — list all cameras with status
router.get('/', (req, res) => {
  const cameras = db.prepare('SELECT * FROM cameras ORDER BY created_at DESC').all();
  res.json(cameras);
});

// POST /cameras — provision new camera
router.post('/', (req, res) => {
  const { id, name, client, yt_key, yt_url, destination, notes } = req.body;
  if (!id || !name || !client) {
    return res.status(400).json({ error: 'id, name, and client are required' });
  }
  if (!/^YNLED\d{4}$/.test(id)) {
    return res.status(400).json({ error: 'Camera ID must be in format YNLED0001–YNLED9999' });
  }
  try {
    db.prepare(`
      INSERT INTO cameras (id, name, client, yt_key, yt_url, destination, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, client, yt_key || null, yt_url || null, destination || 'youtube', notes || null);

    db.prepare(`
      INSERT INTO activity_log (camera_id, event, message)
      VALUES (?, 'provisioned', ?)
    `).run(id, `Camera ${id} (${name}) provisioned for client ${client}`);

    const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
    res.status(201).json({
      camera,
      ehome_config: {
        server_address: process.env.VPS_DOMAIN || 'stream.ynled.com',
        port: 7660,
        device_id: id,
        instructions: `Set Platform Access Mode to EHome, Server Address to ${process.env.VPS_DOMAIN || 'stream.ynled.com'}, Port to 7660, Account/Device ID to ${id}`
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: `Camera ID ${id} already exists` });
    }
    throw err;
  }
});

// GET /cameras/:id — get single camera
router.get('/:id', (req, res) => {
  const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(req.params.id);
  if (!camera) return res.status(404).json({ error: 'Camera not found' });

  const recentActivity = db.prepare(`
    SELECT * FROM activity_log WHERE camera_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...camera, recent_activity: recentActivity });
});

// PUT /cameras/:id — update camera
router.put('/:id', (req, res) => {
  const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(req.params.id);
  if (!camera) return res.status(404).json({ error: 'Camera not found' });

  const { name, client, yt_key, yt_url, destination, notes } = req.body;

  db.prepare(`
    UPDATE cameras SET
      name = COALESCE(?, name),
      client = COALESCE(?, client),
      yt_key = COALESCE(?, yt_key),
      yt_url = COALESCE(?, yt_url),
      destination = COALESCE(?, destination),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(name, client, yt_key, yt_url, destination, notes, req.params.id);

  const updated = db.prepare('SELECT * FROM cameras WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /cameras/:id — remove camera
router.delete('/:id', (req, res) => {
  const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(req.params.id);
  if (!camera) return res.status(404).json({ error: 'Camera not found' });

  db.prepare('DELETE FROM cameras WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO activity_log (camera_id, event, message)
    VALUES (?, 'deprovisioned', ?)
  `).run(req.params.id, `Camera ${req.params.id} (${camera.name}) removed`);

  res.json({ success: true, deleted: camera });
});

// POST /cameras/:id/restart — restart HIKPusher for this camera
router.post('/:id/restart', (req, res) => {
  const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(req.params.id);
  if (!camera) return res.status(404).json({ error: 'Camera not found' });

  db.prepare(`
    INSERT INTO activity_log (camera_id, event, message)
    VALUES (?, 'restarted', ?)
  `).run(req.params.id, `Manual restart triggered for camera ${req.params.id}`);

  try {
    // Restart the PM2 process for this camera's HIKPusher instance
    execSync(`pm2 restart hikpusher-${camera.id} 2>/dev/null || true`);
    db.prepare('UPDATE cameras SET status = ? WHERE id = ?').run('connecting', req.params.id);
    res.json({ success: true, message: `Restart triggered for ${camera.id}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart stream process', detail: err.message });
  }
});

// GET /cameras/:id/embed — return YouTube iframe embed code
router.get('/:id/embed', (req, res) => {
  const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(req.params.id);
  if (!camera) return res.status(404).json({ error: 'Camera not found' });
  if (!camera.yt_url) return res.status(400).json({ error: 'No YouTube URL configured for this camera' });

  // Extract video ID from YouTube watch URL
  const match = camera.yt_url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (!match) return res.status(400).json({ error: 'Invalid YouTube URL format' });

  const videoId = match[1];
  const embed = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${camera.name} — YNLED LiveView" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  res.json({
    camera_id: camera.id,
    camera_name: camera.name,
    video_id: videoId,
    embed_html: embed,
    yt_url: camera.yt_url
  });
});

module.exports = router;
