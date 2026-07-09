const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, store_type } = req.query;
    let sql = 'SELECT a.*, ROUND(AVG(r.rating),1) as avg_rating, COUNT(r.id) as rating_count FROM assets a LEFT JOIN product_ratings r ON r.product_id = a.id AND r.product_type = ?';
    const params = ['store'];
    const conditions = [];
    if (store_type) {
      conditions.push('a.store_type = ?');
      params.push(store_type);
    }
    if (category && category !== 'all') {
      conditions.push('a.category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(a.name LIKE ? OR a.description LIKE ? OR a.tags LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (conditions.length) sql += ' AND ' + conditions.join(' AND ');
    sql += ' GROUP BY a.id ORDER BY a.created_at DESC';
    const result = await q(sql, params);
    res.json({ assets: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await q('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { name, price, original_price, description, tags, category, store_type, image, video_enabled, video_url, stock_status, link } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama asset diperlukan' });
    const r = await q(
      'INSERT INTO assets (name, price, original_price, description, tags, category, store_type, image, video_enabled, video_url, stock_status, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price || 'Gratis', original_price || '', description || '', tags || '', category || 'other', store_type || 'store', image || '', video_enabled ? 1 : 0, video_url || '', stock_status || 'ready', link || '']
    );
    const asset = await q('SELECT * FROM assets WHERE id = ?', [r.lastInsertRowid]);
    res.json({ asset: asset.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const existing = await q('SELECT id FROM assets WHERE id = ?', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Asset not found' });
    const { name, price, original_price, description, tags, category, store_type, image, video_enabled, video_url, stock_status, link } = req.body;
    await q(
      'UPDATE assets SET name=?, price=?, original_price=?, description=?, tags=?, category=?, store_type=?, image=?, video_enabled=?, video_url=?, stock_status=?, link=? WHERE id=?',
      [name, price || 'Gratis', original_price || '', description || '', tags || '', category || 'other', store_type || 'store', image || '', video_enabled ? 1 : 0, video_url || '', stock_status || 'ready', link || '', req.params.id]
    );
    const asset = await q('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    res.json({ asset: asset.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const existing = await q('SELECT id FROM assets WHERE id = ?', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Asset not found' });
    await q('DELETE FROM assets WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
