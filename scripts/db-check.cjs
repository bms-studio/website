require('dotenv').config();
const { createClient } = require('@libsql/client');

(async () => {
  const url = process.env.TURSO_DB_URL;
  const token = process.env.TURSO_DB_TOKEN;
  if (!url || !token) {
    console.log('NO TURSO CONFIG in .env');
    process.exit(1);
  }
  console.log('Connecting...');
  const client = createClient({ url, authToken: token });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT 15s')), 15000));
  try {
    const res = await Promise.race([client.execute('SELECT 1'), timeout]);
    console.log('SELECT 1 ->', JSON.stringify(res.rows[0]));
  } catch (e) {
    console.log('CONNECTION FAILED:', e.message);
    process.exit(1);
  }
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  const names = tables.rows.map(r => r.name);
  console.log('\nTABLES (' + names.length + '):');
  for (const name of names) {
    try {
      const c = await client.execute(`SELECT COUNT(*) AS n FROM "${name}"`);
      console.log('  -', name.padEnd(22), 'rows:', c.rows[0].n);
    } catch (e) {
      console.log('  -', name.padEnd(22), 'ERROR:', e.message);
    }
  }
  client.close();
})();