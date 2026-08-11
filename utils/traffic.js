// utils/traffic.js — Real-time traffic tracker (in-memory, single process)
const SECONDS = 300;                  // ring buffer: 5 menit
const secHits = new Array(SECONDS).fill(0);
const hourlyHits = new Array(24).fill(0);
const routeCount = new Map();         // path -> total (since boot)
const feed = [];                      // aktivitas terbaru
const online = new Map();             // ip -> lastSeen
let totalViews = 0;
let todayViews = 0;
let todayStamp = new Date().toDateString();
const seenToday = new Set();
let lastSec = 0;

function rollDay() {
  const now = new Date().toDateString();
  if (now !== todayStamp) { todayStamp = now; todayViews = 0; seenToday.clear(); }
}

function pruneOnline() {
  const cutoff = Date.now() - 30000;
  for (const [k, t] of online) if (t < cutoff) online.delete(k);
}

function track(path, ip) {
  rollDay();
  const s = Math.floor(Date.now() / 1000);
  secHits[s % SECONDS]++;
  hourlyHits[new Date().getHours()]++;
  totalViews++; todayViews++;
  routeCount.set(path, (routeCount.get(path) || 0) + 1);
  if (ip) { online.set(ip, Date.now()); if (!seenToday.has(ip)) seenToday.add(ip); }
  pruneOnline();
}

function event(type, text) {
  feed.unshift({ type, text, at: Date.now() });
  if (feed.length > 24) feed.pop();
}

function snapshot() {
  rollDay();
  const nowSec = Math.floor(Date.now() / 1000);
  let r1m = 0, r5m = 0;
  for (let i = 0; i < SECONDS; i++) {
    const v = secHits[(nowSec - i) % SECONDS] || 0;
    if (i < 60) r1m += v;
    r5m += v;
  }
  const spark = [];
  for (let i = SECONDS - 1; i >= 0; i--) spark.push(secHits[(nowSec - i) % SECONDS] || 0);
  const top = [...routeCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([path, count]) => ({ path, count }));
  return {
    online: online.size,
    viewsToday: todayViews,
    viewsTotal: totalViews,
    requests1m: r1m,
    requests5m: r5m,
    uniqueToday: seenToday.size,
    hourly: hourlyHits.slice(),
    spark,
    topRoutes: top,
    feed: feed.slice(0, 12),
    ts: Date.now()
  };
}

function stream(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  const send = () => { try { res.write('data: ' + JSON.stringify(snapshot()) + '\n\n'); } catch {} };
  send();
  const iv = setInterval(send, 2000);
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 30000);
  res.on('close', () => { clearInterval(iv); clearInterval(hb); });
}

module.exports = { track, event, snapshot, stream };
