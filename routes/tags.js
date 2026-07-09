const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const router = express.Router();

const OWNER_EMAIL = 'Bamsj37@gmail.com';

async function isOwner(userId) {
  const result = await q('SELECT email FROM users WHERE id = ?', [userId]);
  return result.rows.length && result.rows[0].email === OWNER_EMAIL;
}

router.get('/:userId', async (req, res) => {
  try {
    const result = await q('SELECT id, tag, icon, color, created_at FROM tags WHERE user_id = ? ORDER BY id', [req.params.userId]);
    res.json({ tags: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/', authenticateSession, async (req, res) => {
  try {
    if (!await isOwner(req.user.id) && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });
    const result = await q(
      'SELECT t.id, t.user_id, t.tag, t.icon, t.color, t.created_at, u.email, u.name FROM tags t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.user_id, t.id'
    );
    res.json({ tags: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    if (!await isOwner(req.user.id))
      return res.status(403).json({ error: 'Only the owner can manage tags' });
    const { userId, tag, icon, color } = req.body;
    if (!userId || !tag || !tag.trim())
      return res.status(400).json({ error: 'userId and tag required' });
    const userExists = await q('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userExists.rows.length)
      return res.status(404).json({ error: 'User not found' });
    await q('INSERT INTO tags (user_id, tag, icon, color, created_by) VALUES (?, ?, ?, ?, ?)', [userId, tag.trim(), icon || '', color || '#8b7cfc', req.user.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, async (req, res) => {
  try {
    if (!await isOwner(req.user.id))
      return res.status(403).json({ error: 'Only the owner can manage tags' });
    await q('DELETE FROM tags WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
