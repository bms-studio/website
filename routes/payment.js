// routes/payment.js — Pembayaran QRIS dinamis otomatis
const express = require('express');
const { q } = require('../database/db');
const { toDynamic, merchantName } = require('../utils/qris');
const router = express.Router();

async function getStaticQris() {
  try {
    const r = await q("SELECT value FROM site_config WHERE key = 'qris_static'");
    if (r.rows.length && r.rows[0].value) return String(r.rows[0].value);
  } catch {}
  return process.env.QRIS_STATIC || '';
}

// Cek ketersediaan (untuk menampilkan/menyembunyikan opsi di frontend)
router.get('/status', async (req, res) => {
  try {
    res.json({ enabled: !!(await getStaticQris()) });
  } catch { res.json({ enabled: false }); }
});

// Buat QRIS dinamis untuk sebuah order
router.post('/qris', async (req, res) => {
  try {
    const orderId = parseInt(req.body.orderId, 10);
    if (!orderId) return res.status(400).json({ error: 'orderId wajib diisi' });

    const o = await q('SELECT id, total, user_id FROM orders WHERE id = ?', [orderId]);
    if (!o.rows.length) return res.status(404).json({ error: 'Order tidak ditemukan' });

    // Bind kepemilikan: order milik user terdaftar hanya bisa diakses pemiliknya/admin
    const ownerId = o.rows[0].user_id;
    if (ownerId) {
      const { getDB } = require('../database/db');
      let reqUser = null;
      try {
        const token = req.cookies && req.cookies.session;
        if (token) {
          const u = await q('SELECT id, role FROM users WHERE session_token = ?', [token]);
          if (u.rows.length) reqUser = u.rows[0];
        }
      } catch {}
      if (!reqUser || (Number(reqUser.id) !== Number(ownerId) && reqUser.role !== 'admin')) {
        return res.status(403).json({ error: 'Bukan order Anda' });
      }
    }

    const total = Math.round(Number(o.rows[0].total) || 0);
    if (total <= 0) return res.status(400).json({ error: 'Total order tidak valid untuk QRIS' });

    const staticQris = await getStaticQris();
    if (!staticQris) return res.status(503).json({ error: 'Pembayaran QRIS belum dikonfigurasi admin (set env QRIS_STATIC / config qris_static)' });

    const dynamic = toDynamic(staticQris, total);
    const qr = await require('qrcode').toDataURL(dynamic, { width: 560, margin: 2, errorCorrectionLevel: 'M' });
    res.json({ ok: true, order_id: orderId, amount: total, merchant: merchantName(dynamic), qr });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Gagal membuat QRIS' });
  }
});

module.exports = router;
