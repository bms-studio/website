const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await q('SELECT * FROM promos WHERE active = 1 ORDER BY code');
    res.json({ promos: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/all', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q('SELECT * FROM promos ORDER BY code');
    res.json({ promos: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kode diperlukan' });
  try {
    const result = await q('SELECT * FROM promos WHERE code = ? AND active = 1', [code.toUpperCase()]);
    if (!result.rows.length) return res.json({ valid: false, error: 'Kode tidak valid' });
    const promo = result.rows[0];
    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) return res.json({ valid: false, error: 'Kuota promo habis' });
    res.json({ valid: true, discount: promo.discount, code: promo.code });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { code, discount, max_uses } = req.body;
    if (!code || !discount) return res.status(400).json({ error: 'Kode dan diskon diperlukan' });
    await q('INSERT INTO promos (code, discount, max_uses) VALUES (?, ?, ?)', [code.toUpperCase(), discount, max_uses || 0]);
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Kode sudah ada' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    await q('DELETE FROM promos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:id/toggle', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const p = await q('SELECT active FROM promos WHERE id = ?', [req.params.id]);
    if (!p.rows.length) return res.status(404).json({ error: 'Not found' });
    const active = p.rows[0].active ? 0 : 1;
    await q('UPDATE promos SET active = ? WHERE id = ?', [active, req.params.id]);
    res.json({ success: true, active });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
