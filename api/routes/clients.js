const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /clients — list all clients with camera count and MRR
router.get('/', (req, res) => {
  const clients = db.prepare(`
    SELECT
      cl.*,
      COUNT(ca.id) as camera_count,
      COALESCE(SUM(ca.viewers), 0) as total_viewers
    FROM clients cl
    LEFT JOIN cameras ca ON ca.client = cl.name
    GROUP BY cl.id
    ORDER BY cl.created_at DESC
  `).all();

  const totalMrr = clients.reduce((sum, c) => sum + (c.mrr || 0), 0);
  res.json({ clients, total_mrr: totalMrr });
});

// POST /clients — add new client
router.post('/', (req, res) => {
  const { name, contact, address, plan, mrr } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const result = db.prepare(`
    INSERT INTO clients (name, contact, address, plan, mrr)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, contact || null, address || null, plan || null, mrr || 0);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

module.exports = router;
