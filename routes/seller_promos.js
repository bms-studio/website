const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateSession, async (req, res) => {
  try {
    const result = await q('SELECT * FROM seller_promos WHERE seller_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ promos: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, async (req, res) => {
  try {
    if (!req.user.verified_tag && req.user.role !== 'admin') return res.status(403).json({ error: 'Only verified sellers can create promos' });
    const { code, discount, product_id, max_uses } = req.body;
    if (!code || !discount) return res.status(400).json({ error: 'Code and discount required' });
    if (discount < 1 || discount > 100) return res.status(400).json({ error: 'Discount must be 1-100' });
    const existing = await q('SELECT id FROM seller_promos WHERE code = ? AND seller_id = ?', [code.toUpperCase(), req.user.id]);
    if (existing.rows.length) return res.status(400).json({ error: 'You already have a promo with this code' });
    await q('INSERT INTO seller_promos (seller_id, code, discount, product_id, max_uses) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, code.toUpperCase(), discount, product_id || 0, max_uses || 0]);
    res.json({ success: true, message: 'Promo code created!' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticateSession, async (req, res) => {
  try {
    const promo = await q('SELECT * FROM seller_promos WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (!promo.rows.length) return res.status(404).json({ error: 'Not found' });
    const { discount, max_uses, active } = req.body;
    const updates = []; const params = [];
    if (discount !== undefined) { updates.push('discount = ?'); params.push(discount); }
    if (max_uses !== undefined) { updates.push('max_uses = ?'); params.push(max_uses); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active); }
    if (!updates.length) return res.json({ success: true });
    params.push(req.params.id);
    await q('UPDATE seller_promos SET ' + updates.join(', ') + ' WHERE id = ?', params);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticateSession, async (req, res) => {
  try {
    await q('DELETE FROM seller_promos WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/validate', async (req, res) => {
  try {
    const { code, seller_id, product_id } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });
    let sql = 'SELECT * FROM seller_promos WHERE code = ? AND active = 1';
    const params = [code.toUpperCase()];
    if (seller_id) { sql += ' AND seller_id = ?'; params.push(seller_id); }
    const result = await q(sql, params);
    if (!result.rows.length) return res.json({ valid: false, error: 'Invalid promo code' });
    const promo = result.rows[0];
    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) return res.json({ valid: false, error: 'Promo code has reached max uses' });
    if (promo.product_id && promo.product_id != 0 && promo.product_id != product_id) return res.json({ valid: false, error: 'Promo not valid for this product' });
    res.json({ valid: true, promo });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;