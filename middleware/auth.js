const { q } = require('../database/db');
const { generateSessionToken, COOKIE_OPTIONS, isOwnerEmail } = require('../utils/auth-utils');

async function authenticateSession(req, res, next) {
  const sessionToken = req.cookies?.session;
  if (!sessionToken) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await q(
      'SELECT id, email, name, role, avatar, banner, verified_tag, xp, bio, ref_code, session_expires FROM users WHERE session_token = ?',
      [sessionToken]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'Session expired' });
    const user = result.rows[0];
    if (user.session_expires && new Date(user.session_expires).getTime() < Date.now()) {
      await q("UPDATE users SET session_token = '' WHERE id = ?", [user.id]);
      return res.status(401).json({ error: 'Session expired' });
    }
    req.user = user;
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

async function isOwnerById(userId) {
  const result = await q('SELECT email FROM users WHERE id = ?', [userId]);
  return result.rows.length > 0 && isOwnerEmail(result.rows[0].email);
}

module.exports = { authenticateSession, requireAdmin, generateSessionToken, COOKIE_OPTIONS, isOwnerById };
