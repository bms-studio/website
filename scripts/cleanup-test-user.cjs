require('dotenv').config();
const { createClient } = require('@libsql/client');

(async () => {
  const c = createClient({ url: process.env.TURSO_DB_URL, authToken: process.env.TURSO_DB_TOKEN });
  const r = await c.execute("DELETE FROM users WHERE email = 'bamsj60+otptest@gmail.com'");
  console.log('deleted rows:', r.rowsAffected);
  c.close();
})();
