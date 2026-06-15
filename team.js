/**
 * loginGuard.js — Khoá đăng nhập luỹ tiến (progressive lockout), lưu trong RAM.
 *
 * Mỗi "guard" có bộ đếm RIÊNG (tách biệt hoàn toàn) → bên khách hàng và bên
 * chủ app (super admin) không ảnh hưởng lẫn nhau.
 *
 *  - Cứ `threshold` lần nhập sai liên tiếp → khoá 1 khoảng thời gian.
 *  - `levels` là mảng thời lượng khoá (ms) cho từng cấp leo thang.
 *  - Nếu `repeat = true`  → vượt quá số cấp thì lặp lại cấp cuối (vô hạn).
 *  - Nếu `finalMessage`   → vượt quá số cấp thì hiện thông báo này (vd: liên hệ chủ app).
 */

function fmt(sec) {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m} phút ${s} giây` : `${m} phút`;
  }
  return `${sec} giây`;
}

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.ip
    || req.socket?.remoteAddress
    || 'unknown';
}

function createLoginGuard({ keyFn, threshold = 5, levels, finalMessage = null }) {
  const repeat = !finalMessage;
  const store  = new Map(); // key -> { fails, level, lockedUntil, message, contactOwner }

  // Dọn rác định kỳ để Map không phình mãi.
  setInterval(() => {
    const now = Date.now();
    for (const [k, s] of store) {
      if (s.lockedUntil < now && s.fails === 0 && !s.contactOwner) store.delete(k);
    }
  }, 10 * 60 * 1000).unref?.();

  function getState(key) {
    let s = store.get(key);
    if (!s) { s = { fails: 0, level: 0, lockedUntil: 0, message: null, contactOwner: false }; store.set(key, s); }
    return s;
  }

  // Middleware: chặn nếu đang trong thời gian khoá.
  function middleware(req, res, next) {
    const key = keyFn(req);
    req._loginKey = key;
    const s = getState(key);
    const now = Date.now();

    if (s.contactOwner) {
      return res.status(429).json({ error: s.message, locked: true, contactOwner: true });
    }
    if (s.lockedUntil > now) {
      const remain = Math.ceil((s.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `${s.message} (còn ${fmt(remain)})`,
        locked: true,
        retry_after: remain,
      });
    }
    next();
  }

  // Gọi khi đăng nhập SAI.
  function fail(req) {
    const key = req._loginKey || keyFn(req);
    const s = getState(key);
    s.fails++;
    if (s.fails < threshold) return;

    // Đủ ngưỡng → leo cấp & đặt khoá.
    s.fails = 0;
    let idx = s.level;          // cấp hiện tại (0-based) ánh xạ vào levels
    s.level++;

    if (idx >= levels.length) {
      if (repeat) {
        idx = levels.length - 1;                 // super admin: lặp lại cấp cuối (1 phút)
      } else {
        // Khách hàng: vượt cấp cuối → yêu cầu liên hệ chủ app.
        s.contactOwner = true;
        s.message = finalMessage;
        s.lockedUntil = Date.now() + levels[levels.length - 1];
        return;
      }
    }

    const dur = levels[idx];
    s.lockedUntil = Date.now() + dur;
    s.message = `Bạn đã nhập sai ${threshold} lần. Vui lòng thử lại sau ${fmt(Math.round(dur / 1000))}`;
  }

  // Gọi khi đăng nhập ĐÚNG → xoá trạng thái khoá.
  function success(req) {
    const key = req._loginKey || keyFn(req);
    store.delete(key);
  }

  return { middleware, fail, success };
}

// ── Guard cho BÊN KHÁCH HÀNG (shop login + portal) ──────────────────────
// 5 sai → 2 phút → (5 sai) 5 phút → (5 sai) liên hệ chủ app.
const customerGuard = createLoginGuard({
  threshold: 5,
  levels: [2 * 60 * 1000, 5 * 60 * 1000],
  finalMessage: 'Bạn đã nhập sai quá nhiều lần. Vui lòng liên hệ chủ ứng dụng (quản trị viên) để được hỗ trợ mở khoá.',
  keyFn: (req) => `cust:${clientIp(req)}:${req.body?.shopId || ''}:${req.body?.username || req.body?.phone || ''}`,
});

// ── Guard cho BÊN CHỦ APP (super admin) — ĐỘC LẬP ───────────────────────
// 5 sai → 1 phút, lặp lại vô hạn.
const superGuard = createLoginGuard({
  threshold: 5,
  levels: [60 * 1000],
  finalMessage: null, // repeat = true
  keyFn: (req) => `super:${clientIp(req)}`,
});

module.exports = { createLoginGuard, customerGuard, superGuard, clientIp };
