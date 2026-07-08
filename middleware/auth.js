const crypto = require('crypto');
const { q } = require('../database/db');

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function authenticateSession(req, res, next) {
  const sessionToken = req.cookies?.session;
  if (!sessionToken) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await q('SELECT id, email, name, role, avatar, banner, verified_tag FROM users WHERE session_token = ?', [sessionToken]);
    if (!result.rows.length) return res.status(401).json({ error: 'Session expired' });
    req.user = result.rows[0];
    next();
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' });
  }
  next();
}

module.exports = { authenticateSession, requireAdmin, generateSessionToken };
