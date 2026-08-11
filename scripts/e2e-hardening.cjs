require('dotenv').config();
const { createClient } = require('@libsql/client');

const BASE = 'http://localhost:4000';

async function main() {
  const c = createClient({ url: process.env.TURSO_DB_URL, authToken: process.env.TURSO_DB_TOKEN });
  const results = [];
  const t = (name, cond, detail) => results.push({ name, ok: !!cond, detail });

  // 1. Siapkan user tes + backup sesi asli
  let u = await c.execute("SELECT id, session_token, verified_tag FROM users WHERE LOWER(email) = LOWER('bamsj60+hardening@gmail.com')");
  if (!u.rows.length) { console.log('test user not found'); return; }
  const testUser = u.rows[0];
  const testBackup = { session_token: testUser.session_token, verified_tag: testUser.verified_tag };

  u = await c.execute("SELECT id, session_token FROM users WHERE LOWER(email) = LOWER('user@demo.com')");
  const demoUser = u.rows[0];
  const demoBackup = { session_token: demoUser.session_token };

  const TOKEN_A = 'sess-test-a-' + Date.now();
  const TOKEN_B = 'sess-test-b-' + Date.now();
  const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  await c.execute('UPDATE users SET session_token = ?, session_expires = ? WHERE id = ?', [TOKEN_A, future, testUser.id]);
  await c.execute('UPDATE users SET session_token = ?, session_expires = ? WHERE id = ?', [TOKEN_B, future, demoUser.id]);

  const cookieA = 'session=' + TOKEN_A;
  const cookieB = 'session=' + TOKEN_B;

  async function req(path, opts = {}) {
    const res = await fetch(BASE + path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(opts.cookie ? { Cookie: opts.cookie } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    let json = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, json };
  }

  // 2. /me dengan token valid
  const me = await req('/api/auth/me', { cookie: cookieA });
  t('GET /api/auth/me (sesi valid)', me.status === 200 && me.json?.user?.email === 'bamsj60+hardening@gmail.com', `${me.status}`);

  // 3. Anti mass-assignment: PUT /api/admin/profile dengan xp -> xp tidak berubah
  const before = await c.execute('SELECT xp FROM users WHERE id = ?', [testUser.id]);
  const p = await req('/api/admin/profile', { method: 'PUT', cookie: cookieA, body: { xp: 99999 } });
  const after = await c.execute('SELECT xp FROM users WHERE id = ?', [testUser.id]);
  t('PUT profile xp ditolak (whitelist)', (p.status === 200) && (after.rows[0].xp === before.rows[0].xp), `xp before=${before.rows[0].xp} after=${after.rows[0].xp}`);

  // 4. Chat customer->admin (fitur sah)
  const chatCreate = await req('/api/chats/admin/product', { method: 'POST', cookie: cookieA, body: { productId: 27, productType: 'script' } });
  t('POST /api/chats/admin/product', chatCreate.status === 200 && !!chatCreate.json?.orderId, `${chatCreate.status} ${JSON.stringify(chatCreate.json)}`);
  const orderId = chatCreate.json?.orderId;

  if (orderId) {
    // 5. Pemilik bisa akses chat-nya
    const own = await req('/api/chats/' + orderId, { cookie: cookieA });
    t('GET chat milik sendiri -> 200', own.status === 200, `${own.status}`);

    // 6. IDOR: user lain DITOLAK
    const otherRead = await req('/api/chats/' + orderId, { cookie: cookieB });
    t('IDOR: GET chat order orang lain -> 403', otherRead.status === 403, `${otherRead.status}`);
    const otherWrite = await req('/api/chats/' + orderId + '/message', { method: 'POST', cookie: cookieB, body: { text: 'hack' } });
    t('IDOR: POST message chat orang lain -> 403', otherWrite.status === 403, `${otherWrite.status}`);
  }

  // 7. Validasi diskon seller-promo
  await c.execute('UPDATE users SET verified_tag = 1 WHERE id = ?', [testUser.id]);
  const badPromo = await req('/api/seller-promos', { method: 'POST', cookie: cookieA, body: { code: 'TST100', discount: 101 } });
  t('promo discount 101 -> 400', badPromo.status === 400, `${badPromo.status}`);
  const okPromo = await req('/api/seller-promos', { method: 'POST', cookie: cookieA, body: { code: 'TST100', discount: 100 } });
  t('promo discount 100 -> 200', okPromo.status === 200, `${okPromo.status}`);
  if (okPromo.status === 200) {
    const promoId = (await c.execute("SELECT id FROM seller_promos WHERE code = 'TST100' AND seller_id = ?", [testUser.id])).rows[0].id;
    const putPromo = await req('/api/seller-promos/' + promoId, { method: 'PUT', cookie: cookieA, body: { discount: 500 } });
    t('promo PUT discount 500 -> 400', putPromo.status === 400, `${putPromo.status}`);
    await c.execute('DELETE FROM seller_promos WHERE id = ?', [promoId]);
  }

  // 8. Validasi rating testimonial
  const badTest = await req('/api/testimonials', { method: 'POST', cookie: cookieA, body: { text: 'tes', rating: 9 } });
  t('testimonial rating 9 -> 400', badTest.status === 400, `${badTest.status}`);

  // 9. Rate limit auth berfungsi (login 10/15m) - tidak dites penuh, cukup satu request 400-an? skip.

  // 10. Bersihkan data tes
  if (orderId) {
    await c.execute('DELETE FROM chats WHERE order_id = ?', [orderId]);
    await c.execute('DELETE FROM orders WHERE id = ?', [orderId]);
  }
  await c.execute('UPDATE users SET session_token = ?, verified_tag = ? WHERE id = ?', [testBackup.session_token, testBackup.verified_tag, testUser.id]);
  await c.execute('UPDATE users SET session_token = ? WHERE id = ?', [demoBackup.session_token, demoUser.id]);

  let pass = 0, fail = 0;
  for (const r of results) { if (r.ok) pass++; else fail++; console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.ok ? '' : '  -> ' + r.detail)); }
  console.log(`\n===== E2E: ${pass} passed, ${fail} failed =====`);
  c.close();
}

main().catch(e => { console.error(e); process.exit(1); });
