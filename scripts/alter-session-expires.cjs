require('dotenv').config();
const { createClient } = require('@libsql/client');

(async () => {
  const c = createClient({ url: process.env.TURSO_DB_URL, authToken: process.env.TURSO_DB_TOKEN });
  try {
    await c.execute('ALTER TABLE users ADD COLUMN session_expires TEXT DEFAULT \'\'');
    console.log('ALTER OK: session_expires added');
  } catch (e) {
    console.log('ALTER note:', e.message.includes('duplicate column') ? 'column already exists' : e.message);
  }
  const r = await c.execute('PRAGMA table_info(users)');
  console.log('users columns:', r.rows.map(x => x.name).join(', '));
  c.close();
})();
