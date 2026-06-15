/**
 * monitor.js — Realtime Monitoring (đọc thông số THẬT của server/DB)
 *
 * Lấy mẫu định kỳ: RAM hệ thống, CPU, độ trễ event-loop, pool DB, độ trễ DB.
 * Phân tích xu hướng (least-squares) → DỰ BÁO trước ~10 phút khi sắp chạm ngưỡng
 * nguy hiểm, để chủ app chủ động xử lý trước khi app quá tải / sập.
 */
const os = require('os');
const { pool, q } = require('../db');

const SAMPLE_MS   = 10000;  // lấy mẫu mỗi 10s
const MAX_SAMPLES = 60;     // giữ ~10 phút lịch sử
const PREDICT_MIN = 10;     // dự báo trước 10 phút

const samples = [];
let lastCpu = os.cpus();
let loopLag = 0;

// ── Đo độ trễ event-loop (chỉ báo quá tải tốt nhất) ────────────────────
let _last = process.hrtime.bigint();
const _li = setInterval(() => {
  const now = process.hrtime.bigint();
  loopLag = Math.max(0, Math.round(Number(now - _last) / 1e6 - 500));
  _last = now;
}, 500);
_li.unref && _li.unref();

function cpuPercent() {
  const now = os.cpus();
  let idle = 0, total = 0;
  for (let i = 0; i < now.length; i++) {
    const a = lastCpu[i].times, b = now[i].times;
    idle  += b.idle - a.idle;
    total += (b.user-a.user)+(b.nice-a.nice)+(b.sys-a.sys)+(b.irq-a.irq)+(b.idle-a.idle);
  }
  lastCpu = now;
  return total ? Math.round((1 - idle / total) * 100) : 0;
}

async function dbLatency() {
  const t = Date.now();
  try { await q('SELECT 1'); return Date.now() - t; } catch { return -1; }
}

// Ngưỡng cảnh báo / nguy hiểm cho từng chỉ số
const TH = {
  mem:        { warn: 85, crit: 94, unit: '%',  label: 'RAM hệ thống' },
  cpu:        { warn: 80, crit: 92, unit: '%',  label: 'CPU' },
  loopLag:    { warn: 80, crit: 250, unit: 'ms', label: 'Độ trễ xử lý (event-loop)' },
  dbLatency:  { warn: 200, crit: 900, unit: 'ms', label: 'Độ trễ Database' },
  dbPoolUtil: { warn: 80, crit: 100, unit: '%',  label: 'Kết nối DB (pool)' },
};

async function sample() {
  const mem = Math.round((1 - os.freemem() / os.totalmem()) * 100);
  const cpu = cpuPercent();
  const dbLat = await dbLatency();
  const poolMax = (pool.options && pool.options.max) || 20;
  const dbPoolUtil = Math.round(((pool.totalCount || 0) / poolMax) * 100);
  const s = {
    t: Date.now(), mem, cpu, loopLag, dbLatency: dbLat, dbPoolUtil,
    dbWaiting: pool.waitingCount || 0, dbTotal: pool.totalCount || 0, dbIdle: pool.idleCount || 0,
  };
  samples.push(s);
  if (samples.length > MAX_SAMPLES) samples.shift();
  return s;
}

const _si = setInterval(() => { sample().catch(()=>{}); }, SAMPLE_MS);
_si.unref && _si.unref();
sample().catch(()=>{}); // mẫu đầu tiên ngay

// Dự báo: slope (đơn vị/phút) bằng least-squares; ETA tới ngưỡng nguy hiểm
function predict(key) {
  const ys = samples.map(s => s[key]).filter(v => typeof v === 'number' && v >= 0);
  const n = ys.length;
  if (n < 4) return null;
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - mx) * (ys[i] - my); den += (i - mx) ** 2; }
  const slopePerSample = den ? num / den : 0;
  const slopePerMin = slopePerSample * (60000 / SAMPLE_MS);
  const cur = ys[n - 1];
  const crit = TH[key].crit, warn = TH[key].warn;
  let etaMin = null;
  // Chỉ dự báo khi chỉ số ĐÃ leo vào vùng đáng kể (≥60% ngưỡng cảnh báo) + xu hướng tăng rõ —
  // tránh báo động giả từ nền thấp khi mới khởi động.
  if (slopePerMin > 0.3 && cur >= warn * 0.6 && cur < crit)
    etaMin = Math.round((crit - cur) / slopePerMin);
  return {
    slopePerMin: +slopePerMin.toFixed(2),
    projected: Math.round(cur + slopePerMin * PREDICT_MIN),
    etaMin,
  };
}

function statusOf(v, th) {
  if (v < 0 || v == null) return 'unknown';
  if (v >= th.crit) return 'critical';
  if (v >= th.warn) return 'warning';
  return 'ok';
}

function snapshot() {
  const last = samples[samples.length - 1] || {};
  const metrics = {}, alerts = [];
  for (const key of Object.keys(TH)) {
    const th = TH[key];
    const val = last[key];
    const st = statusOf(val, th);
    const pr = predict(key);
    metrics[key] = { label: th.label, value: val, unit: th.unit, warn: th.warn, crit: th.crit, status: st, predict: pr };

    if (st === 'critical')
      alerts.push({ level: 'critical', key, msg: `🔴 ${th.label} đang ở mức NGUY HIỂM: ${val}${th.unit} (ngưỡng ${th.crit}${th.unit}). Cần xử lý ngay!` });
    else if (st === 'warning')
      alerts.push({ level: 'warning', key, msg: `🟠 ${th.label} đang cao: ${val}${th.unit} (cảnh báo từ ${th.warn}${th.unit}).` });

    // Dự báo trước 10 phút (nếu xu hướng đang tăng tới ngưỡng nguy hiểm)
    if (pr && pr.etaMin != null && pr.etaMin <= PREDICT_MIN && st !== 'critical') {
      alerts.push({ level: 'predict', key,
        msg: `⏰ DỰ BÁO: ${th.label} sẽ chạm ngưỡng nguy hiểm (${th.crit}${th.unit}) trong ~${Math.max(1, pr.etaMin)} phút. Chuẩn bị xử lý để tránh quá tải!` });
    }
  }
  const overall = alerts.some(a => a.level === 'critical') ? 'critical'
                : alerts.some(a => a.level === 'predict')  ? 'predict'
                : alerts.some(a => a.level === 'warning')  ? 'warning' : 'ok';
  return {
    overall,
    uptime: Math.round(process.uptime()),
    memProcessMB: Math.round(process.memoryUsage().rss / 1048576),
    cores: os.cpus().length,
    metrics, alerts,
    history: samples.slice(-30).map(s => ({ t: s.t, mem: s.mem, cpu: s.cpu, loopLag: s.loopLag })),
    sampledAt: last.t || Date.now(),
    samplesCount: samples.length,
  };
}

module.exports = { snapshot };
