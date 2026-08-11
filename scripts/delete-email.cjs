require('dotenv').config();
const { createClient } = require('@libsql/client');

(async () => {
  const email = process.argv[2];
  if (!email) { console.log('usage: node scripts/delete-email.cjs <email>'); process.exit(1); }
  const c = createClient({ url: process.env.TURSO_DB_URL, authToken: process.env.TURSO_DB_TOKEN });
  const r = await c.execute('DELETE FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  console.log('deleted rows:', r.rowsAffected, '| email:', email);
  c.close();
})();
