const path = require('path');
const { createClient } = require('@libsql/client');

let db = null;
let initialized = false;

function getLocalPath() {
  if (process.env.VERCEL) return '/tmp/data.db';
  return path.join(__dirname, 'data.db');
}

function getDB() {
  if (db) return db;
  const tursoUrl = process.env.TURSO_DB_URL;
  const tursoToken = process.env.TURSO_DB_TOKEN;

  if (tursoUrl && tursoToken && tursoUrl.startsWith('libsql://') && tursoToken.length > 10) {
    try {
      const client = createClient({ url: tursoUrl.trim(), authToken: tursoToken.trim() });
      db = client;
      return db;
    } catch (e) {
      console.error('Turso connection failed:', e.message);
    }
  }
  const localPath = getLocalPath();
  try {
    db = createClient({ url: 'file:' + localPath });
    return db;
  } catch (e) {
    console.error('Local DB failed:', e.message);
    return null;
  }
}

async function initDBFast() {
  if (initialized) return;
  initialized = true;
  let client = getDB();
  if (!client) return;
  const tableDefs = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT '', password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', avatar TEXT DEFAULT '', otp TEXT DEFAULT '', otp_expires TEXT DEFAULT '', verified INTEGER DEFAULT 0, session_token TEXT DEFAULT '', session_expires TEXT DEFAULT '', verified_tag INTEGER DEFAULT 0, banner TEXT DEFAULT '', xp INTEGER DEFAULT 0, bio TEXT DEFAULT '', ref_code TEXT DEFAULT '', referred_by INTEGER DEFAULT NULL, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price TEXT NOT NULL DEFAULT 'Gratis', original_price TEXT DEFAULT '', description TEXT NOT NULL DEFAULT '', tags TEXT DEFAULT '', category TEXT NOT NULL DEFAULT 'other', store_type TEXT NOT NULL DEFAULT 'store', image TEXT DEFAULT '', video_enabled INTEGER DEFAULT 0, video_url TEXT DEFAULT '', stock_status TEXT DEFAULT 'ready', link TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, items TEXT NOT NULL DEFAULT '[]', total REAL DEFAULT 0, status TEXT DEFAULT 'pending', customer_name TEXT DEFAULT '', customer_email TEXT DEFAULT '', customer_contact TEXT DEFAULT '', payment_method TEXT DEFAULT '', store_type TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, project TEXT DEFAULT '', budget TEXT DEFAULT '', message TEXT NOT NULL, read INTEGER DEFAULT 0, user_id INTEGER, reply TEXT DEFAULT '', replied_at TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS promos (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, discount INTEGER NOT NULL DEFAULT 10, max_uses INTEGER DEFAULT 0, used_count INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, user_name TEXT DEFAULT '', text TEXT NOT NULL, rating INTEGER DEFAULT 5, product_name TEXT DEFAULT '', store_type TEXT DEFAULT '', seller_name TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS public_products (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, price TEXT NOT NULL DEFAULT 'Gratis', description TEXT DEFAULT '', image TEXT DEFAULT '', link TEXT DEFAULT '', category TEXT DEFAULT 'other', status TEXT DEFAULT 'pending', admin_note TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS seller_applications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT DEFAULT '', email TEXT DEFAULT '', reason TEXT DEFAULT '', portfolio TEXT DEFAULT '', status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT DEFAULT '', message TEXT NOT NULL, active INTEGER DEFAULT 1, created_by INTEGER NOT NULL, duration_minutes INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS public_chats (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, user_name TEXT DEFAULT '', user_role TEXT DEFAULT 'user', user_avatar TEXT DEFAULT '', text TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, tag TEXT NOT NULL, created_by INTEGER NOT NULL, icon TEXT DEFAULT '', color TEXT DEFAULT '#e6e3dc', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS promotions (id INTEGER PRIMARY KEY AUTOINCREMENT, image_url TEXT NOT NULL, link TEXT DEFAULT '', title TEXT DEFAULT '', sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, user_id INTEGER, messages TEXT DEFAULT '[]', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS product_ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, product_type TEXT NOT NULL, user_id INTEGER NOT NULL, rating INTEGER NOT NULL DEFAULT 5, review TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS seller_ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL, user_id INTEGER NOT NULL, rating INTEGER NOT NULL DEFAULT 5, review TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS seller_chats (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, customer_id INTEGER NOT NULL, seller_id INTEGER NOT NULL, messages TEXT DEFAULT '[]', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS seller_promos (id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER NOT NULL, code TEXT NOT NULL, discount INTEGER NOT NULL DEFAULT 10, product_id INTEGER DEFAULT 0, max_uses INTEGER DEFAULT 0, used_count INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS user_links (user_id INTEGER PRIMARY KEY, socials TEXT DEFAULT '[]', webhook TEXT DEFAULT '', updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS site_config (key TEXT PRIMARY KEY, value TEXT DEFAULT '')`,
    `CREATE TABLE IF NOT EXISTS portfolio (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, desc TEXT DEFAULT '', category TEXT DEFAULT 'Web', color TEXT DEFAULT '#e6e3dc', image TEXT DEFAULT '', tags TEXT DEFAULT '', sort INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
  ];
  for (const sql of tableDefs) {
    try { await client.execute(sql); } catch {}
  }
  const migrations = [
    `ALTER TABLE messages ADD COLUMN user_id INTEGER`,
    `ALTER TABLE messages ADD COLUMN reply TEXT DEFAULT ''`,
    `ALTER TABLE messages ADD COLUMN replied_at TEXT DEFAULT ''`,
    // Skema orders versi lama bisa kehilangan kolom baru -> migrasi defensif
    `ALTER TABLE orders ADD COLUMN customer_contact TEXT DEFAULT ''`,
    `ALTER TABLE orders ADD COLUMN store_type TEXT DEFAULT ''`,
    `ALTER TABLE orders ADD COLUMN customer_name TEXT DEFAULT ''`,
    `ALTER TABLE orders ADD COLUMN customer_email TEXT DEFAULT ''`,
  ];
  // Indexes: mempercepat semua query berat (JOIN rating, lookup session, filter store)
  const indexDefs = [
    `CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token)`,
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_users_ref ON users(ref_code)`,
    `CREATE INDEX IF NOT EXISTS idx_assets_store ON assets(store_type, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_assets_cat ON assets(category)`,
    `CREATE INDEX IF NOT EXISTS idx_ratings_prod ON product_ratings(product_id, product_type)`,
    `CREATE INDEX IF NOT EXISTS idx_ratings_user ON product_ratings(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_seller_ratings_sel ON seller_ratings(seller_id)`,
    `CREATE INDEX IF NOT EXISTS idx_seller_ratings_user ON seller_ratings(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pp_user ON public_products(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pp_status ON public_products(status, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_chats_order ON chats(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_seller_chats_lookup ON seller_chats(product_id, customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_seller_chats_seller ON seller_chats(seller_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(active, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_public_chats_after ON public_chats(id)`,
    `CREATE INDEX IF NOT EXISTS idx_apps_user_status ON seller_applications(user_id, status)`,
  ];
  // Batch: semua DDL dalam 1 round-trip (init lokal & cold-start serverless jauh lebih cepat)
  try {
    await client.batch(
      [...tableDefs, ...migrations, ...indexDefs].map(sql => ({ sql })),
      'write'
    );
  } catch {
    for (const sql of tableDefs) { try { await client.execute(sql); } catch {} }
    for (const sql of migrations) { try { await client.execute(sql); } catch {} }
    for (const sql of indexDefs) { try { await client.execute(sql); } catch {} }
  }
  await migratePalette(client);
  await seedDefaults(client);
}

// Migrasi palet sekali-jalan: remap warna lama (ungu/cyan neon) -> palet silver di baris tersimpan
async function migratePalette(client) {
  try {
    const flag = await client.execute("SELECT value FROM site_config WHERE key = 'palette_silver_v1'");
    if (flag.rows.length) return;
    const caseExpr = `CASE lower(color)
      WHEN '#8b7cfc' THEN '#e6e3dc' WHEN '#93ab9e' THEN '#93ab9e'
      WHEN '#5fd6ea' THEN '#93ab9e' WHEN '#5d9de8' THEN '#8fa6bc'
      WHEN '#ec6aa8' THEN '#c8a8ae' WHEN '#f472b6' THEN '#c8a8ae'
      WHEN '#fb923c' THEN '#c0a878' WHEN '#f09140' THEN '#c0a878'
      WHEN '#60a5fa' THEN '#8fa6bc' WHEN '#c792ea' THEN '#cfbfce'
      ELSE color END`;
    await client.execute(`UPDATE tags SET color = ${caseExpr} WHERE lower(color) IN ('#8b7cfc','#93ab9e','#5fd6ea','#5d9de8','#ec6aa8','#f472b6','#fb923c','#f09140','#60a5fa','#c792ea')`);
    await client.execute(`UPDATE portfolio SET color = ${caseExpr} WHERE lower(color) IN ('#8b7cfc','#93ab9e','#5fd6ea','#5d9de8','#ec6aa8','#f472b6','#fb923c','#f09140','#60a5fa','#c792ea')`);
    await client.execute("INSERT INTO site_config (key, value) VALUES ('palette_silver_v1', '1')");
    console.log('[migrate] palette silver v1 applied');
  } catch (e) {
    console.error('[migrate] palette failed:', e.message);
  }
}

async function seedDefaults(client) {
  try {
    const flag = await client.execute("SELECT value FROM site_config WHERE key = 'portfolio_seeded'");
    if (flag.rows.length) return;
    const defaults = [
      ['E-Commerce Platform', 'Platform e-commerce full-stack dengan payment gateway.', 'Web', '#e6e3dc', 'Next.js,PostgreSQL,Stripe'],
      ['Adventure Quest RPG', 'Game RPG Roblox open-world dengan quest dan multiplayer.', 'Roblox', '#93ab9e', 'Lua,Roblox Studio,Animation'],
      ['FitTracker Pro', 'Aplikasi fitness tracker dengan AI recommendations.', 'Mobile', '#c8a8ae', 'Flutter,Firebase,ML Kit'],
      ['Tower Defense X', 'Game tower defense dengan 50+ level dan leaderboard.', 'Roblox', '#c0a878', 'Lua,Roblox,Game Design'],
      ['CollabSpace', 'Platform kolaborasi tim real-time.', 'Web', '#8fa6bc', 'React,WebRTC,Socket.io'],
      ['NexusBot Pro', 'Discord bot all-in-one dengan 100+ commands.', 'Bot', '#cfbfce', 'Discord.js,Node.js,MongoDB'],
    ];
    for (let i = 0; i < defaults.length; i++) {
      const d = defaults[i];
      await client.execute('INSERT INTO portfolio (title, desc, category, color, tags, sort) VALUES (?, ?, ?, ?, ?, ?)', [d[0], d[1], d[2], d[3], d[4], i]);
    }
    await client.execute("INSERT INTO site_config (key, value) VALUES ('portfolio_seeded', '1')");
    console.log('[seed] portfolio defaults inserted');
  } catch (e) {
    console.error('[seed] failed:', e.message);
  }
}

async function q(sql, params = []) {
  const client = getDB();
  const result = await client.execute({ sql, args: params });
  return result;
}

module.exports = { getDB, initDBFast, q };
