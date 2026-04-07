const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /activity — recent activity log (last 100 events)
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const camera_id = req.query.camera_id;

  let query = 'SELECT * FROM activity_log';
  const params = [];

  if (camera_id) {
    query += ' WHERE camera_id = ?';
    params.push(camera_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const events = db.prepare(query).all(...params);
  res.json(events);
});

module.exports = router;
