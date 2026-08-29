const express = require('express');
const { q } = require('../database/db');
const router = express.Router();

// GET /api/avatars/:userId -> gambar avatar (binary) dengan cache panjang.
// Payload JSON lain cukup kirim URL ini, bukan base64 -> hemat MB pada tiap fetch.
router.get('/:userId', async (req, res) => {
  try {
    const r = await q('SELECT avatar FROM users WHERE id = ?', [req.params.userId]);
    const av = r.rows.length ? r.rows[0].avatar : '';
    if (!av) return res.status(404).end();
    const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(av);
    if (m) {
      res.setHeader('Content-Type', m[1]);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.end(Buffer.from(m[2], 'base64'));
    } else if (/^https?:\/\//.test(av)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.redirect(302, av);
    } else {
      res.status(404).end();
    }
  } catch { res.status(500).end(); }
});

module.exports = router;
