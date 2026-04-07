const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /stats — aggregate stats
router.get('/', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM cameras').get().count;
  const live = db.prepare("SELECT COUNT(*) as count FROM cameras WHERE status = 'live'").get().count;
  const connecting = db.prepare("SELECT COUNT(*) as count FROM cameras WHERE status = 'connecting'").get().count;
  const offline = db.prepare("SELECT COUNT(*) as count FROM cameras WHERE status = 'offline'").get().count;
  const totalViewers = db.prepare('SELECT COALESCE(SUM(viewers), 0) as total FROM cameras').get().total;
  const clients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;

  res.json({
    cameras: { total, live, connecting, offline },
    viewers: totalViewers,
    clients
  });
});

module.exports = router;
