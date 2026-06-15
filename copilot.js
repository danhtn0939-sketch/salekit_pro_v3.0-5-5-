/**
 * signatures.js — Xác thực chữ ký webhook mạng xã hội (Fix #1).
 *
 * Mục tiêu: chặn kẻ xấu giả mạo tin nhắn vào hệ thống (apiKey nằm trong URL
 * widget công khai nên không thể coi là bí mật). Mỗi nền tảng có cơ chế ký riêng:
 *
 *  - Facebook Messenger & WhatsApp (Meta): header `X-Hub-Signature-256`
 *      = "sha256=" + HMAC_SHA256(app_secret, rawBody)
 *  - Zalo OA: header `X-ZEvent-Signature`
 *      = "mac=" + SHA256(app_id + rawBody + timestamp + oa_secret)
 *  - Telegram: header `X-Telegram-Bot-Api-Secret-Token` so khớp secret đã đăng ký.
 *
 * Chính sách thực thi (backward-compatible):
 *  - Nếu shop ĐÃ cấu hình secret cho kênh  → BẮT BUỘC verify, sai → từ chối.
 *  - Nếu shop CHƯA cấu hình secret          → cảnh báo 1 lần rồi cho qua,
 *    để các shop cũ chưa kịp nhập secret vẫn chạy. Khuyến nghị bật cho mọi shop.
 */

const crypto = require('crypto');

// So sánh hằng thời gian (chống dò theo thời gian phản hồi).
function safeEqualHex(aHex, bHex) {
  if (!aHex || !bHex) return false;
  const a = Buffer.from(String(aHex), 'utf8');
  const b = Buffer.from(String(bHex), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function rawBodyOf(req) {
  // express.json({ verify }) lưu Buffer gốc vào req.rawBody (xem server.js).
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');
  // Fallback: serialize lại body đã parse (kém chính xác hơn nhưng còn hơn không).
  try { return Buffer.from(JSON.stringify(req.body || {}), 'utf8'); }
  catch { return Buffer.from(''); }
}

// Cảnh báo "chưa cấu hình secret" — chỉ log 1 lần / shop / kênh để khỏi spam log.
const _warned = new Set();
function warnOnce(shopId, channel) {
  const k = `${shopId}:${channel}`;
  if (_warned.has(k)) return;
  _warned.add(k);
  console.warn(`[WebhookSig] ⚠️  ${channel} của shop ${shopId} CHƯA cấu hình secret — bỏ qua verify (KHÔNG an toàn). Hãy nhập secret ở mục Kênh.`);
}

// ── Meta (Facebook Messenger + WhatsApp) ────────────────────────────────
function verifyMeta(req, appSecret) {
  const header = req.headers['x-hub-signature-256'] || '';
  const expected = header.startsWith('sha256=') ? header.slice(7) : header;
  const mac = crypto.createHmac('sha256', appSecret).update(rawBodyOf(req)).digest('hex');
  return safeEqualHex(expected, mac);
}

// ── Zalo OA ─────────────────────────────────────────────────────────────
function verifyZalo(req, appId, oaSecret) {
  const header = req.headers['x-zevent-signature'] || '';
  const expected = header.startsWith('mac=') ? header.slice(4) : header;
  const timestamp = String(req.body?.timestamp || req.headers['x-zevent-timestamp'] || '');
  const data = rawBodyOf(req).toString('utf8');
  const mac = crypto.createHash('sha256').update(appId + data + timestamp + oaSecret).digest('hex');
  return safeEqualHex(expected, mac);
}

// ── Telegram ────────────────────────────────────────────────────────────
function verifyTelegram(req, secretToken) {
  const got = req.headers['x-telegram-bot-api-secret-token'] || '';
  return safeEqualHex(got, secretToken);
}

/**
 * verifyWebhook — điểm vào chung.
 * @param channel  'facebook' | 'whatsapp' | 'zalo' | 'telegram'
 * @param tok      bản ghi channel_tokens của shop (có thể null)
 * @param req      request Express (cần req.rawBody + headers)
 * @param shopId   để log cảnh báo
 * @returns true nếu hợp lệ HOẶC chưa cấu hình secret (cho qua); false nếu sai chữ ký.
 */
function verifyWebhook(channel, tok, req, shopId) {
  switch (channel) {
    case 'facebook':
    case 'whatsapp': {
      const secret = tok?.app_secret;
      if (!secret) { warnOnce(shopId, channel); return true; }
      return verifyMeta(req, secret);
    }
    case 'zalo': {
      const secret = tok?.app_secret;
      const appId  = tok?.app_id;
      if (!secret || !appId) { warnOnce(shopId, channel); return true; }
      return verifyZalo(req, appId, secret);
    }
    case 'telegram': {
      const secret = tok?.verify_token; // Telegram secret_token lưu chung cột verify_token
      if (!secret) { warnOnce(shopId, channel); return true; }
      return verifyTelegram(req, secret);
    }
    default:
      return true;
  }
}

module.exports = { verifyWebhook, verifyMeta, verifyZalo, verifyTelegram, safeEqualHex };
