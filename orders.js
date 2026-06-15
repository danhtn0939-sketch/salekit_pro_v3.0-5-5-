/**
 * storage.js — Lưu ảnh lên S3 / Cloudflare R2 khi được cấu hình (Fix #4).
 *
 * Mặc định (KHÔNG cấu hình env) → trả về null, caller giữ nguyên hành vi cũ
 * (ghi file vào public/uploads hoặc base64). Khi buyer set các biến S3_* thì
 * ảnh được đẩy lên object storage và trả về URL CDN, giúp DB không phình.
 *
 * Bật bằng env (tương thích S3 và R2):
 *   S3_BUCKET=...            (bắt buộc để kích hoạt)
 *   S3_REGION=auto           (R2 dùng 'auto')
 *   S3_ENDPOINT=...          (R2: https://<accountid>.r2.cloudflarestorage.com)
 *   S3_ACCESS_KEY_ID=...
 *   S3_SECRET_ACCESS_KEY=...
 *   S3_PUBLIC_BASE=...       (URL công khai/CDN, vd https://cdn.shop.com)
 *
 * Cần cài optional dependency: npm i @aws-sdk/client-s3
 */

let _client = null;       // null = chưa init; false = không khả dụng
function getClient() {
  if (_client !== null) return _client;
  if (!process.env.S3_BUCKET) { _client = false; return _client; }
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    _client = new S3Client({
      region:   process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId:     process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: !!process.env.S3_ENDPOINT, // R2/MinIO cần path-style
    });
    console.log('[Storage] ✅ S3/R2 đã bật — ảnh sẽ lưu lên bucket:', process.env.S3_BUCKET);
  } catch (e) {
    console.warn('[Storage] ⚠️  S3_BUCKET đã set nhưng thiếu @aws-sdk/client-s3 — chạy: npm i @aws-sdk/client-s3. Tạm thời lưu local.');
    _client = false;
  }
  return _client;
}

function isEnabled() { return getClient() !== false; }

/**
 * putImage — đẩy buffer ảnh lên S3/R2.
 * @returns URL công khai, hoặc null nếu storage chưa bật (caller tự xử lý fallback).
 */
async function putImage(buf, ext, keyHint = 'img') {
  const client = getClient();
  if (!client) return null;
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const safeExt = (ext || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const key = `products/${keyHint}_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${safeExt}`;
  const contentType = safeExt === 'jpg' ? 'image/jpeg' : `image/${safeExt}`;

  await client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buf,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const base = (process.env.S3_PUBLIC_BASE || '').replace(/\/$/, '');
  return base
    ? `${base}/${key}`
    : `${(process.env.S3_ENDPOINT || '').replace(/\/$/, '')}/${process.env.S3_BUCKET}/${key}`;
}

module.exports = { isEnabled, putImage };
