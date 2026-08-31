// utils/webhooks.js — dispatch notifikasi ke webhook seller & admin (fire-safe, non-blocking fatal)
const https = require('https');
const { URL } = require('url');
const { q } = require('../database/db');

const WEBHOOK_TIMEOUT = 3000;

// Hanya webhook https (Discord/Telegram/pipedream/zapier/dll). Tidak pernah http plaintext.
function isSafeWebhookUrl(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return false;
  if (!/^https:\/\/[^\s"'<>\\]+$/i.test(s)) return false;
  return s.length <= 2000;
}

// Link publik (social buttons) — boleh http/https, tetap tanpa spasi/quote.
function isSafeLinkUrl(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return false;
  if (!/^https?:\/\/[^\s"'<>\\]+$/i.test(s)) return false;
  return s.length <= 2000;
}

// Normalisasi array {label,url} -> bersih, hanya yang valid, terbatas.
function parseSocials(raw, maxItems = 12) {
  let arr = [];
  try { arr = JSON.parse(raw || '[]'); } catch { arr = []; }
  if (!Array.isArray(arr)) arr = [];
  const out = [];
  for (const item of arr) {
    if (!item || !isSafeLinkUrl(item.url)) continue;
    out.push({ label: String(item.label || 'link').trim().slice(0, 40) || 'link', url: String(item.url).trim() });
    if (out.length >= maxItems) break;
  }
  return out;
}

function sendJson(url, payload) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch { return resolve({ ok: false, status: 0, error: 'invalid url' }); }
    if (u.protocol !== 'https:') return resolve({ ok: false, status: 0, error: 'not https' });
    let body;
    try { body = Buffer.from(JSON.stringify(payload)); } catch { return resolve({ ok: false, status: 0, error: 'bad payload' }); }
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BMS-Webhook/1.0',
        'Content-Length': body.length
      }
    }, (res) => {
      res.resume();
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
    });
    req.setTimeout(WEBHOOK_TIMEOUT, () => req.destroy(new Error('timeout')));
    req.on('error', (e) => resolve({ ok: false, status: 0, error: (e && e.message) || 'error' }));
    req.write(body);
    req.end();
  });
}

function toPriceNum(v) {
  const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
}

function rupiah(v) {
  return 'Rp ' + toPriceNum(v).toLocaleString('id-ID');
}

// Deteksi platform webhook dari hostname -> sesuaikan format payload
// (Discord butuh field `content`/`embeds`, Telegram bot API butuh `text`).
function webhookPlatform(url) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h === 'discord.com' || h.endsWith('.discord.com') || h === 'discordapp.com' || h.endsWith('.discordapp.com') || h.includes('discord.com')) return 'discord';
    if (h === 'api.telegram.org' || h.endsWith('.api.telegram.org')) return 'telegram';
  } catch {}
  return 'generic';
}

function lineItems(items, maxLen) {
  const lines = (Array.isArray(items) ? items : []).map(it => {
    const qty = parseInt(it.qty, 10);
    return '- ' + String(it.name || 'Item') + (qty > 1 ? ' x' + qty : '') + ' (' + rupiah(it.price) + ')';
  });
  let out = lines.join('\n');
  const n = maxLen || 1024;
  if (out.length > n) out = out.slice(0, n - 3) + '...';
  return out || '-';
}

// data = struktur generik {event,type,title,message,store,order_id,buyer,payment_method,total,items[],timestamp}
function buildWebhookPayload(url, data) {
  const platform = webhookPlatform(url);
  const d = data || {};
  const summary = '[BMS] ' + (d.title || 'Notifikasi') + (d.order_id ? ' · Order #' + d.order_id : '');
  const body = [
    summary,
    d.api || '',
    d.store ? 'Toko: ' + d.store : '',
    d.type === 'admin' ? 'Tipe: Admin (semua seller)' : (d.type === 'seller' ? 'Tipe: Seller' : ''),
    d.buyer ? 'Pembeli: ' + (d.buyer.name || '') + (d.buyer.id ? ' (ID ' + d.buyer.id + ')' : '') + ((d.buyer.email) ? ' · ' + d.buyer.email : '') + (d.buyer.contact ? ' · ' + d.buyer.contact : '') : '',
    d.payment_method ? 'Pembayaran: ' + d.payment_method : '',
    d.total != null ? 'Total: ' + rupiah(d.total) : '',
    d.message || ''
  ].filter(Boolean).join('\n');

  if (platform === 'discord') {
    const fields = [];
    if (d.items && d.items.length) fields.push({ name: 'Produk', value: lineItems(d.items, 1024), inline: false });
    if (d.total != null) fields.push({ name: 'Total', value: rupiah(d.total), inline: true });
    if (d.payment_method) fields.push({ name: 'Pembayaran', value: String(d.payment_method), inline: true });
    if (d.buyer) {
      const b = d.buyer.name || '';
      fields.push({ name: 'Pembeli', value: (b ? b : 'ID ' + d.buyer.id) + (d.buyer.email ? '\n' + d.buyer.email : '') + (d.buyer.contact ? '\n' + d.buyer.contact : ''), inline: false });
    }
    return {
      username: 'BMS Order',
      content: summary.slice(0, 2000),
      embeds: [{
        title: String(d.store || d.title || 'Notifikasi BMS').slice(0, 256),
        color: d.type === 'admin' ? 0x8fb89f : 0xc9ad72,
        description: String(d.message || summary).slice(0, 2048),
        fields: fields.slice(0, 25),
        timestamp: (d.timestamp ? new Date(d.timestamp) : new Date()).toISOString()
      }]
    };
  }

  if (platform === 'telegram') {
    return { text: body.slice(0, 4000) };
  }

  return d;
}

async function getWebhookByUser(userId) {
  try {
    const r = await q('SELECT webhook FROM user_links WHERE user_id = ?', [userId]);
    const w = r.rows[0] && r.rows[0].webhook;
    return w && isSafeWebhookUrl(w) ? w : null;
  } catch { return null; }
}

async function getAdminWebhooks() {
  try {
    const r = await q("SELECT value FROM site_config WHERE key = 'admin_webhooks'");
    const raw = r.rows[0] && r.rows[0].value;
    let arr = [];
    try { arr = JSON.parse(raw || '[]'); } catch { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    return arr.filter(u => isSafeWebhookUrl(u)).slice(0, 10);
  } catch { return []; }
}

// Pada saat order dibuat:
//  - seller hanya menerima item MILIKNYA (pengelompokan per sellerId dari cart public)
//  - admin menerima SEMUA item (webhook admin = site_config admin_webhooks)
async function notifyOrder(order, items) {
  try {
    const ts = new Date().toISOString();
    const list = Array.isArray(items) ? items : [];
    const allItems = [];
    const bySeller = {};
    for (const it of list) {
      const isPublic = String(it.store_type) === 'public';
      const sellerId = isPublic ? parseInt(it.sellerId, 10) : null;
      const row = {
        product_id: it.productId || it.id || 0,
        name: String(it.name || 'Item').slice(0, 200),
        price: it.price,
        qty: parseInt(it.qty, 10) || 1,
        seller: String(it.sellerName || '').slice(0, 200),
        store_type: it.store_type || 'store'
      };
      allItems.push(row);
      if (sellerId) { (bySeller[sellerId] = bySeller[sellerId] || []).push(row); }
    }
    const base = {
      event: 'order.created',
      app: 'BMS Platform',
      source: 'https://bms-platfrom.vercel.app',
      order_id: Number(order && order.id) || 0,
      buyer: {
        id: Number(order && order.user_id) || null,
        name: String((order && order.customer_name) || 'Guest'),
        email: String((order && order.customer_email) || ''),
        contact: String((order && order.customer_contact) || '')
      },
      payment_method: String((order && order.payment_method) || 'N/A'),
      total_order: Number(order && order.total) || 0,
      timestamp: ts
    };
    const tasks = [];
    for (const [sid, sitems] of Object.entries(bySeller)) {
      const w = await getWebhookByUser(Number(sid));
      if (!w) continue;
      const sellerTotal = sitems.reduce((s, it) => s + (toPriceNum(it.price) * it.qty), 0);
      const sellerPayload = Object.assign({}, base, {
        type: 'seller',
        seller_id: Number(sid),
        store: String(sitems[0] && sitems[0].seller).slice(0, 200) || ('Seller #' + sid),
        items: sitems,
        total: sellerTotal,
        title: 'Order baru — produk kamu dibeli'
      });
      tasks.push(sendJson(w, buildWebhookPayload(w, sellerPayload)));
    }
    const adminWs = await getAdminWebhooks();
    for (const w of adminWs) {
      const adminPayload = Object.assign({}, base, {
        type: 'admin',
        items: allItems,
        seller_count: Object.keys(bySeller).length,
        title: 'Order baru masuk'
      });
      tasks.push(sendJson(w, buildWebhookPayload(w, adminPayload)));
    }
    await Promise.allSettled(tasks);
  } catch (e) {
    console.error('[webhook] notifyOrder failed:', e && e.message);
  }
}

module.exports = { sendJson, notifyOrder, buildWebhookPayload, webhookPlatform, isSafeWebhookUrl, isSafeLinkUrl, parseSocials };