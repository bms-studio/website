const express = require('express');
const { q } = require('../database/db');
const { authenticateSession } = require('../middleware/auth');
const { isOwnerEmail } = require('../utils/auth-utils');

const router = express.Router();

const PUBLIC_KEYS = [
  'dev_avatar', 'dev_banner',
  'dev_name', 'dev_handle', 'dev_bio', 'dev_location', 'dev_email', 'dev_website', 'dev_joined',
  'dev_social_discord', 'dev_social_youtube', 'dev_social_github', 'dev_social_tiktok', 'dev_social_instagram',
  'dev_stat_repos', 'dev_stat_projects', 'dev_stat_followers', 'dev_stat_years',
  'dev_langs',
  'site_buttons'
];

router.get('/', async (req, res) => {
  try {
    const result = await q('SELECT key, value FROM site_config');
    const config = {};
    for (const row of result.rows) {
      if (PUBLIC_KEYS.includes(row.key)) config[row.key] = row.value;
    }
    res.json({ config });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/', authenticateSession, async (req, res) => {
  try {
    if (!isOwnerEmail(req.user.email)) return res.status(403).json({ error: 'Forbidden: owner only' });
    const { key, value, values } = req.body;
    const entries = [];
    if (values && typeof values === 'object') {
      for (const [k, v] of Object.entries(values)) entries.push([k, v]);
    } else if (key) {
      entries.push([key, value]);
    }
    if (!entries.length) return res.status(400).json({ error: 'key/value or values required' });
    for (const [k, v] of entries) {
      if (!PUBLIC_KEYS.includes(k)) return res.status(400).json({ error: 'Invalid key: ' + k });
      await q('INSERT INTO site_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [k, String(v ?? '').slice(0, 3000000)]);
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
