// utils/qris.js — Port inti qris-dinamis (MIT, github.com/verssache/qris-dinamis)
// Konversi QRIS statis -> dinamis (EMVCo TLV + CRC16-CCITT). Framework-agnostic.

function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseTLV(str) {
  const out = [];
  let i = 0;
  const s = String(str || '');
  while (i + 4 <= s.length) {
    const tag = s.substr(i, 2);
    const len = parseInt(s.substr(i + 2, 2), 10);
    if (!/^\d{2}$/.test(tag) || isNaN(len)) break;
    out.push({ tag, len, value: s.substr(i + 4, len) });
    i += 4 + len;
  }
  return out;
}

function buildTLV(tag, value) {
  return tag + String(value.length).padStart(2, '0') + value;
}

// Ubah QRIS statis menjadi dinamis dengan nominal tertentu.
// Tag 01: 11 -> 12 | sisip tag 54 (amount) sebelum tag 58 | buang fee tags | recompute CRC.
function toDynamic(staticQris, amount) {
  // Hapus hanya newline/whitespace pinggir — spasi DI DALAM nilai (nama merchant) adalah bagian sah dari payload
  const clean = String(staticQris || '').replace(/[\r\n\t]/g, '').trim();
  if (clean.length < 20) throw new Error('QRIS statis tidak valid');
  const els = parseTLV(clean);
  if (!els.length || !els.find(e => e.tag === '63')) throw new Error('Struktur QRIS tidak dikenali');

  const amt = Math.round(Number(amount));
  if (!isFinite(amt) || amt <= 0) throw new Error('Nominal tidak valid');
  const amountStr = String(amt);

  let out = '';
  let inserted = false;
  for (const e of els) {
    if (e.tag === '63') continue;              // CRC lama dibuang
    if (e.tag === '54') continue;              // amount lama dibuang
    if (e.tag === '55' || e.tag === '56' || e.tag === '57') continue; // fee tags
    let value = e.value;
    if (e.tag === '01') value = '12';          // statis -> dinamis
    if (e.tag === '58') { out += buildTLV('54', amountStr); inserted = true; }
    out += buildTLV(e.tag, value);
  }
  if (!inserted) out += buildTLV('54', amountStr);
  out += '6304';
  return out + crc16(out);
}

function merchantName(qrisString) {
  const el = parseTLV(String(qrisString || '')).find(t => t.tag === '59');
  return el ? el.value : '';
}

module.exports = { crc16, parseTLV, buildTLV, toDynamic, merchantName };
