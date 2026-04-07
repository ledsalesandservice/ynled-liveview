const API_TOKEN = process.env.API_TOKEN;

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = authHeader.slice(7);
  if (!API_TOKEN) {
    return res.status(500).json({ error: 'API_TOKEN not configured on server' });
  }
  if (token !== API_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  next();
}

module.exports = requireAuth;
