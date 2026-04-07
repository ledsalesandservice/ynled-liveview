require('dotenv').config();

const express = require('express');
const requireAuth = require('./middleware/auth');

const camerasRouter = require('./routes/cameras');
const activityRouter = require('./routes/activity');
const statsRouter = require('./routes/stats');
const clientsRouter = require('./routes/clients');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// All API routes require bearer token auth
app.use('/api/v1', requireAuth);

app.use('/api/v1/cameras', camerasRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/clients', clientsRouter);
app.use('/api/v1/health', healthRouter);

// Root — no auth, useful for nginx/LB health probes
app.get('/', (req, res) => res.json({ service: 'ynled-liveview-api', status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`YNLED LiveView API listening on 127.0.0.1:${PORT}`);
  console.log(`DB: ${process.env.DB_PATH || '/opt/ynled/db/liveview.db'}`);
});
