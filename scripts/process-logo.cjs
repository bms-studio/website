// scripts/process-logo.cjs â€” optimasi logo: transparansi flood-fill + trim + resize
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const OUT_DIR = process.argv[3];
if (!SRC || !OUT_DIR) { console.error('usage: node process-logo.cjs <src.png> <outdir>'); process.exit(1); }

const src = PNG.sync.read(fs.readFileSync(SRC));
const W = src.width, H = src.height, D = src.data;
console.log('source:', W + 'x' + H);

// 1) Flood-fill dari tepi: pixel gelap yang terhubung ke border -> transparan (konservatif)
const TOL = 16; // luminance threshold
const visited = new Uint8Array(W * H);
const stack = [];
const push = (p) => { if (!visited[p]) { visited[p] = 1; stack.push(p); } };
for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
let cleared = 0;
while (stack.length) {
  const p = stack.pop();
  const o = p * 4;
  const lum = 0.2126 * D[o] + 0.7152 * D[o + 1] + 0.0722 * D[o + 2];
  if (lum > TOL) continue;           // bukan background -> stop
  if (D[o + 3] === 0) continue;
  D[o + 3] = 0; cleared++;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) push(p - 1);
  if (x < W - 1) push(p + 1);
  if (y > 0) push(p - W);
  if (y < H - 1) push(p + W);
}
console.log('transparent px:', cleared, '(' + Math.round(cleared * 100 / (W * H)) + '%)');

// 2) Trim ke bounding box pixel yang terlihat
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (D[(y * W + x) * 4 + 3] > 8) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}
const tw = maxX - minX + 1, th = maxY - minY + 1;
console.log('trim box:', tw + 'x' + th);

// 3) Resize box-filter alpha-weighted
function resize(n) {
  const out = new PNG({ width: n, height: n });
  const side = Math.max(tw, th); // fit contain, center
  const scale = n / side;
  const dw = Math.round(tw * scale), dh = Math.round(th * scale);
  const ox = Math.floor((n - dw) / 2), oy = Math.floor((n - dh) / 2);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const o = (y * n + x) * 4;
    if (x < ox || y < oy || x >= ox + dw || y >= oy + dh) { out.data[o + 3] = 0; continue; }
    // petakan ke blok sumber
    const sx0 = minX + Math.floor((x - ox) / scale), sx1 = Math.min(minX + tw, minX + Math.ceil((x - ox + 1) / scale));
    const sy0 = minY + Math.floor((y - oy) / scale), sy1 = Math.min(minY + th, minY + Math.ceil((y - oy + 1) / scale));
    let r = 0, g = 0, b = 0, a = 0, n2 = 0;
    for (let yy = sy0; yy < Math.max(sy1, sy0 + 1); yy++) for (let xx = sx0; xx < Math.max(sx1, sx0 + 1); xx++) {
      const so = (yy * W + xx) * 4;
      const al = D[so + 3] / 255;
      r += D[so] * al; g += D[so + 1] * al; b += D[so + 2] * al; a += D[so + 3]; n2++;
    }
    const aa = a / n2;
    out.data[o] = aa > 0 ? Math.round(r / (aa / 255) / n2) : 0;
    out.data[o + 1] = aa > 0 ? Math.round(g / (aa / 255) / n2) : 0;
    out.data[o + 2] = aa > 0 ? Math.round(b / (aa / 255) / n2) : 0;
    out.data[o + 3] = Math.round(aa);
  }
  return out;
}

for (const n of [256, 128, 64]) {
  const img = resize(n);
  const file = path.join(OUT_DIR, 'logo-bms-' + n + '.png');
  fs.writeFileSync(file, PNG.sync.write(img));
  console.log('wrote', file, Math.round(fs.statSync(file).size / 1024 * 10) / 10 + 'KB');
}

