const express = require('express');
const { q } = require('../database/db');
const { authenticateSession, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// ============ VERIFIKASI PEMBELIAN ============
// Rating produk/seller hanya untuk user yang BENAR-BENAR membeli (enforcement server-side).

async function hasPurchased(userId, productId, productType) {
  try {
    const res = await q("SELECT items FROM orders WHERE user_id = ? AND items IS NOT NULL AND items != '[]' AND (status IS NULL OR LOWER(status) NOT IN ('failed','cancelled'))", [userId]);
    const pid = Number(productId);
    for (const row of res.rows) {
      let items = [];
      try { items = JSON.parse(row.items || '[]'); } catch {}
      for (const it of items) {
        const t = it.store_type || (it.productId !== undefined ? 'public' : 'store');
        if (t !== productType) continue;
        let id = Number(it.productId);
        if (typeof it.id === 'string' && it.id.startsWith('public_')) id = Number(it.id.slice(7));
        else if (!it.productId) id = Number(it.id);
        if (id === pid) return true;
      }
    }
  } catch {}
  return false;
}

async function hasBoughtFrom(userId, sellerId) {
  try {
    const res = await q("SELECT items FROM orders WHERE user_id = ? AND items IS NOT NULL AND items != '[]' AND (status IS NULL OR LOWER(status) NOT IN ('failed','cancelled'))", [userId]);
    const sid = Number(sellerId);
    for (const row of res.rows) {
      let items = [];
      try { items = JSON.parse(row.items || '[]'); } catch {}
      for (const it of items) {
        if (it.store_type === 'public' && Number(it.sellerId) === sid) return true;
      }
    }
  } catch {}
  return false;
}

// Get all products (all statuses)
router.get('/products', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || '';
    let sql = 'SELECT p.*, u.name as seller_name, u.email as seller_email FROM public_products p LEFT JOIN users u ON p.user_id = u.id';
    const params = [];
    if (status) { sql += ' WHERE p.status = ?'; params.push(status); }
    sql += ' ORDER BY p.created_at DESC';
    const result = await q(sql, params);
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get products by user
router.get('/products/user/:userId', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q(
      'SELECT p.*, u.name as seller_name, u.email as seller_email FROM public_products p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = ? ORDER BY p.created_at DESC',
      [req.params.userId]
    );
    res.json({ products: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Approve / reject product
router.put('/products/:id/status', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await q('UPDATE public_products SET status = ?, admin_note = ? WHERE id = ?', [status, admin_note || '', req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Delete any product
router.delete('/products/:id', authenticateSession, requireAdmin, async (req, res) => {
  try { await q('DELETE FROM public_products WHERE id = ?', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

// Get all seller applications
router.get('/applications', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const result = await q(
      'SELECT a.*, u.name as user_name, u.email as user_email, u.verified_tag FROM seller_applications a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC'
    );
    res.json({ applications: result.rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// Approve / reject seller application
router.put('/applications/:id', authenticateSession, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await q('UPDATE seller_applications SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'approved') {
      const app = await q('SELECT user_id FROM seller_applications WHERE id = ?', [req.params.id]);
      if (app.rows.length) await q('UPDATE users SET verified_tag = 1 WHERE id = ?', [app.rows[0].user_id]);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ RATINGS ============
router.post('/ratings', authenticateSession, async (req, res) => {
  try {
    const { product_id, product_type, rating, review } = req.body;
    if (!product_id || !product_type || !rating) return res.status(400).json({ error: 'Required fields missing' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    if (!(await hasPurchased(req.user.id, product_id, product_type))) return res.status(403).json({ error: 'Kamu hanya bisa memberi rating produk yang sudah kamu beli' });
    // Check if already rated
    const existing = await q('SELECT id FROM product_ratings WHERE product_id = ? AND product_type = ? AND user_id = ?', [product_id, product_type, req.user.id]);
    if (existing.rows.length) {
      await q('UPDATE product_ratings SET rating = ?, review = ? WHERE id = ?', [rating, review || '', existing.rows[0].id]);
    } else {
      await q('INSERT INTO product_ratings (product_id, product_type, user_id, rating, review) VALUES (?, ?, ?, ?, ?)',
        [product_id, product_type, req.user.id, rating, review || '']);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/ratings/:productType/:productId', async (req, res) => {
  try {
    const ratings = await q('SELECT r.*, u.name as user_name FROM product_ratings r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = ? AND r.product_type = ? ORDER BY r.created_at DESC',
      [req.params.productId, req.params.productType]);
    const stats = await q('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM product_ratings WHERE product_id = ? AND product_type = ?',
      [req.params.productId, req.params.productType]);
    let mine = null;
    const tok = req.cookies?.session;
    if (tok) {
      try {
        const u = await q('SELECT id FROM users WHERE session_token = ?', [tok]);
        if (u.rows.length) {
          const m = await q('SELECT rating, review FROM product_ratings WHERE product_id = ? AND product_type = ? AND user_id = ?',
            [req.params.productId, req.params.productType, u.rows[0].id]);
          if (m.rows.length) mine = m.rows[0];
        }
      } catch {}
    }
    res.json({ ratings: ratings.rows, stats: stats.rows[0] || { avg_rating: 0, total: 0 }, mine });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ SELLER RATINGS ============
router.post('/seller-ratings', authenticateSession, async (req, res) => {
  try {
    const { seller_id, rating, review } = req.body;
    if (!seller_id || !rating) return res.status(400).json({ error: 'Required fields missing' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    if (Number(seller_id) === req.user.id) return res.status(400).json({ error: 'Tidak bisa menilai diri sendiri' });
    if (!(await hasBoughtFrom(req.user.id, seller_id))) return res.status(403).json({ error: 'Kamu hanya bisa menilai seller setelah membeli produknya' });
    const existing = await q('SELECT id FROM seller_ratings WHERE seller_id = ? AND user_id = ?', [seller_id, req.user.id]);
    if (existing.rows.length) {
      await q('UPDATE seller_ratings SET rating = ?, review = ? WHERE id = ?', [rating, review || '', existing.rows[0].id]);
    } else {
      await q('INSERT INTO seller_ratings (seller_id, user_id, rating, review) VALUES (?, ?, ?, ?)', [seller_id, req.user.id, rating, review || '']);
    }
    const stats = await q('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM seller_ratings WHERE seller_id = ?', [seller_id]);
    res.json({ success: true, stats: stats.rows[0] || { avg_rating: 0, total: 0 } });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/seller-ratings/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const stats = await q('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM seller_ratings WHERE seller_id = ?', [sellerId]);
    let mine = null;
    const tok = req.cookies?.session;
    if (tok) {
      try {
        const u = await q('SELECT id FROM users WHERE session_token = ?', [tok]);
        if (u.rows.length) {
          const m = await q('SELECT rating, review FROM seller_ratings WHERE seller_id = ? AND user_id = ?', [sellerId, u.rows[0].id]);
          if (m.rows.length) mine = m.rows[0];
        }
      } catch {}
    }
    res.json({ avg_rating: (stats.rows[0] && stats.rows[0].avg_rating) || 0, total: (stats.rows[0] && stats.rows[0].total) || 0, mine });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ INVITE LINK ============
router.get('/invite', authenticateSession, async (req, res) => {
  try {
    let code = req.user.ref_code;
    if (!code) {
      for (let i = 0; i < 6; i++) {
        code = 'BMS' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const ex = await q('SELECT id FROM users WHERE ref_code = ?', [code]);
        if (!ex.rows.length) break;
        code = '';
      }
      if (!code) return res.status(500).json({ error: 'Gagal generate kode' });
      await q('UPDATE users SET ref_code = ? WHERE id = ?', [code, req.user.id]);
      req.user.ref_code = code;
    }
    const host = req.get('host') || 'bms-platfrom.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    res.json({ code, link: proto + '://' + host + '/?ref=' + code });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
