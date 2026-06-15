// Load environment variables from .env (Node >= 20.12). Must run BEFORE require('./db').
// Uses absolute path so startup location (cwd) does not matter.
try { if (process.loadEnvFile) process.loadEnvFile(require('path').join(__dirname, '.env')); }
catch { /* no .env file — using system environment (Railway/Render/Docker) */ }

const express    = require('express');
const http       = require('http');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const { Server } = require('socket.io');
const { q, one, all, initSchema } = require('./db');
const { analyzeSentiment, scoreMessage, updateCustomerScore, callAI, detectProvider, modelForProvider } = require('./ai');
const { PLANS, RESOURCE_LABEL, RESOURCE_TABLE, getPlans } = require('./src/constants');
const { auth, adminOnly, superAuth, customerAuth } = require('./src/middleware/auth');
const { customerGuard, superGuard } = require('./src/middleware/loginGuard');
const storage = require('./src/storage');          // Fix #4 — lưu ảnh S3/R2 (tùy chọn)

const app        = express();
const httpServer = http.createServer(app);

// Fix #7 — Socket.IO CORS: allow env-configured origins, default to same-origin in prod
const _allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : (process.env.NODE_ENV === 'production' ? false : '*');
const io = new Server(httpServer, {
  cors: { origin: _allowedOrigins, methods: ['GET', 'POST'] },
  pingTimeout:  30000,
  pingInterval: 25000,
});

// Fix #3: scale ngang nhiều instance. Khi set REDIS_URL → dùng Redis adapter để
// sự kiện real-time đồng bộ giữa các tiến trình/máy. Không set → single-instance (như cũ).
// Cần optional dep: npm i @socket.io/redis-adapter redis
if (process.env.REDIS_URL) {
  (async () => {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const { createClient }  = require('redis');
      const pub = createClient({ url: process.env.REDIS_URL });
      const sub = pub.duplicate();
      pub.on('error', e => console.error('[Redis] pub error:', e.message));
      sub.on('error', e => console.error('[Redis] sub error:', e.message));
      await Promise.all([pub.connect(), sub.connect()]);
      io.adapter(createAdapter(pub, sub));
      console.log('[Socket.IO] ✅ Redis adapter đã bật — sẵn sàng scale ngang nhiều instance.');
    } catch (e) {
      console.warn('[Socket.IO] ⚠️  REDIS_URL đã set nhưng không bật được Redis adapter (' + e.message + '). Chạy: npm i @socket.io/redis-adapter redis. Tạm thời single-instance.');
    }
  })();
}

// Behind a reverse proxy (Railway/Render/NGINX): resolve the real client IP.
app.set('trust proxy', 1);

// ── SECURITY HEADERS ──────────────────────────────────────────────────
// Dependency-free baseline hardening (production hygiene).
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
// Fix #1: giữ lại body thô (rawBody) để xác thực chữ ký webhook (Meta/Zalo).
app.use(express.json({
  limit: '8mb', // cho phép upload ảnh sản phẩm (base64)
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ── RATE LIMITING ─────────────────────────────────────────────────────
// Đăng nhập (shop/portal/super) dùng khoá luỹ tiến RIÊNG — xem src/middleware/loginGuard.js
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5,                    // tối đa 5 lần đăng ký/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in 1 hour.' },
});

// Fix #2 — Widget public endpoint rate limiter (chống spam bot)
// 60 messages/minute per IP per shop — enough for real users, blocks bots
const widgetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => `${req.ip}:${req.params.apiKey || 'widget'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please slow down (60/min limit).' },
  skip: () => process.env.NODE_ENV === 'test',
});

const JWT_SECRET   = process.env.JWT_SECRET;
const SUPER_USER   = process.env.SUPER_ADMIN_USER;
const SUPER_PASS   = process.env.SUPER_ADMIN_PASS;
const PORT         = process.env.PORT || 4000;

if (!JWT_SECRET || !SUPER_USER || !SUPER_PASS) {
  console.error('❌ FATAL: Missing required environment variables:');
  if (!JWT_SECRET)  console.error('   - JWT_SECRET  (generate: openssl rand -hex 32)');
  if (!SUPER_USER)  console.error('   - SUPER_ADMIN_USER');
  if (!SUPER_PASS)  console.error('   - SUPER_ADMIN_PASS');
  process.exit(1);
}

// ── SOCKET.IO ─────────────────────────────────────────────────────────
// Bắt buộc xác thực JWT khi kết nối — chống nghe lén real-time xuyên shop.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
    || (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return next(new Error('unauthorized'));
  try {
    socket.data.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('join', (shopId) => {
    const u = socket.data.user || {};
    // Only allow joining the shop's own room; super admin can join any shop.
    if (u.role === 'superadmin' || u.shopId === shopId) {
      socket.join('shop:' + shopId);
    } else {
      socket.emit('auth_error', 'forbidden');
    }
  });
});

// Helper: emit sự kiện đến tất cả dashboard của shop
function emit(shopId, event, data) {
  io.to('shop:' + shopId).emit(event, data);
}
exports.emit = emit;

// PLANS, RESOURCE_LABEL, RESOURCE_TABLE → xem src/constants.js

async function checkPlanLimit(shopId, resource) {
  const shop  = await one('SELECT plan FROM shops WHERE id=$1', [shopId]);
  const plans = await getPlans();
  const plan  = plans[shop?.plan] || plans.free;
  const limit = plan[resource];
  if (limit === -1) return { ok: true }; // unlimited
  const row = await one(`SELECT COUNT(*) n FROM ${RESOURCE_TABLE[resource]} WHERE shop_id=$1`, [shopId]);
  const current = +row.n;
  if (current >= limit) return { ok: false, limit, current, plan: shop.plan, resource };
  return { ok: true };
}

// auth, adminOnly, superAuth, customerAuth → xem src/middleware/auth.js

// ── AUTH ─────────────────────────────────────────────────────────────
app.post('/api/auth/login', customerGuard.middleware, async (req, res) => {
  try {
    const { shopId, username, password } = req.body;
    const user = await one(
      'SELECT * FROM users WHERE shop_id=$1 AND username=$2',
      [shopId, username]
    );
    if (!user || !bcrypt.compareSync(password, user.password)) {
      customerGuard.fail(req);                 // đếm sai → khoá luỹ tiến (2p → 5p → liên hệ chủ app)
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    customerGuard.success(req);                 // đúng → reset bộ đếm

    const token = jwt.sign({ shopId: user.shop_id, userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    const shop  = await one('SELECT id, name, plan, api_key FROM shops WHERE id=$1', [user.shop_id]);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role }, shop });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/auth/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await one('SELECT * FROM users WHERE id=$1', [req.userId]);
    if (!bcrypt.compareSync(oldPassword, user.password))
      return res.status(400).json({ error: 'Current password is incorrect' });
    await q('UPDATE users SET password=$1 WHERE id=$2', [bcrypt.hashSync(newPassword, 10), req.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CUSTOMERS ────────────────────────────────────────────────────────
app.get('/api/customers', auth, async (req, res) => {
  try {
    // Fix #4 — Pagination: ?page=1&limit=50&status=hot&search=Lan
    // Backward-compatible: nếu không truyền page thì trả về toàn bộ (legacy)
    const { page, limit: limitQ, status, search } = req.query;
    const usePagination = !!page;
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const pageSize = Math.min(200, parseInt(limitQ) || 50);
    const offset   = (pageNum - 1) * pageSize;

    // Build WHERE filters
    const filters = ['c.shop_id=$1'];
    const params  = [req.shopId];
    if (req.role === 'agent') { /* handled separately below */ }
    if (status) { params.push(status); filters.push(`c.status=$${params.length}`); }
    if (search) { params.push(`%${search}%`); filters.push(`(c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`); }
    const where = filters.join(' AND ');

    let rows, total;
    if (req.role === 'agent') {
      const agentWhere = `c.shop_id=$1 AND ca.user_id=$2${status ? ` AND c.status=$3` : ''}`;
      const agentParams = [req.shopId, req.userId, ...(status ? [status] : [])];
      if (usePagination) {
        const cnt = await one(
          `SELECT COUNT(*) n FROM customers c INNER JOIN customer_assignments ca ON ca.customer_id=c.id AND ca.user_id=$2 WHERE c.shop_id=$1`,
          [req.shopId, req.userId]
        );
        total = +cnt.n;
        rows = await all(
          `SELECT c.* FROM customers c INNER JOIN customer_assignments ca ON ca.customer_id=c.id AND ca.user_id=$2
           WHERE c.shop_id=$1 ORDER BY c.id DESC LIMIT $3 OFFSET $4`,
          [req.shopId, req.userId, pageSize, offset]
        );
      } else {
        rows = await all(
          `SELECT c.* FROM customers c INNER JOIN customer_assignments ca ON ca.customer_id=c.id AND ca.user_id=$2
           WHERE c.shop_id=$1 ORDER BY c.id DESC`,
          [req.shopId, req.userId]
        );
      }
    } else if (usePagination) {
      const cntParams = [...params];
      const cnt = await one(`SELECT COUNT(*) n FROM customers c WHERE ${where}`, cntParams);
      total = +cnt.n;
      params.push(pageSize, offset);
      rows = await all(
        `SELECT * FROM customers c WHERE ${where} ORDER BY c.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
    } else {
      rows = await all(`SELECT * FROM customers c WHERE ${where} ORDER BY c.id DESC`, params);
    }

    if (usePagination) {
      res.json({ data: rows, total, page: pageNum, limit: pageSize, pages: Math.ceil(total / pageSize) });
    } else {
      res.json(rows); // legacy — returns array for backward compatibility with existing frontend
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/customers', auth, async (req, res) => {
  try {
    const { name, phone, email, source, product, status, note } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });
    const lim = await checkPlanLimit(req.shopId, 'customers');
    if (!lim.ok) return res.status(403).json({ error: `The ${lim.plan} plan allows a maximum of ${lim.limit} ${RESOURCE_LABEL.customers} (currently: ${lim.current}/${lim.limit}). Upgrade your plan to continue.`, limit_exceeded: true, resource: 'customers' });
    const r = await one(
      `INSERT INTO customers (shop_id,name,phone,email,source,product,status,note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [req.shopId, name, phone, email, source, product, status || 'new', note]
    );
    // Phát sự kiện real-time
    emit(req.shopId, 'customer:new', { id: r.id, name, status: status||'new', source });
    res.json({ id: r.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:id', auth, async (req, res) => {
  try {
    const { name, phone, email, source, product, status, note } = req.body;
    const old = await one('SELECT status FROM customers WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
    await q(
      `UPDATE customers SET name=$1,phone=$2,email=$3,source=$4,product=$5,status=$6,note=$7
       WHERE id=$8 AND shop_id=$9`,
      [name, phone, email, source, product, status, note, req.params.id, req.shopId]
    );
    if (old && old.status !== status) {
      await q('INSERT INTO activity_log (shop_id,customer_id,actor,action,detail) VALUES ($1,$2,$3,$4,$5)',
        [req.shopId, req.params.id, 'staff', 'status_change', `${old.status} → ${status}`]);
      emit(req.shopId, 'customer:status', { id: req.params.id, name, oldStatus: old.status, newStatus: status });
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', auth, async (req, res) => {
  try {
    await q('DELETE FROM customers WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PRODUCTS ─────────────────────────────────────────────────────────
app.get('/api/products', auth, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM products WHERE shop_id=$1 ORDER BY id DESC', [req.shopId]);
    res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, price, emoji, descr, tags, badge, image, stock } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required' });
    const lim = await checkPlanLimit(req.shopId, 'products');
    if (!lim.ok) return res.status(403).json({ error: `The ${lim.plan} plan allows a maximum of ${lim.limit} ${RESOURCE_LABEL.products} (currently: ${lim.current}/${lim.limit}). Upgrade your plan to continue.`, limit_exceeded: true, resource: 'products' });
    const r = await one(
      `INSERT INTO products (shop_id,name,price,emoji,descr,tags,badge,image,stock)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [req.shopId, name, price, emoji || '📦', descr, JSON.stringify(tags || []), badge || '', image || null, parseInt(stock,10)||0]
    );
    res.json({ id: r.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { name, price, emoji, descr, tags, badge, image, stock } = req.body;
    await q(
      `UPDATE products SET name=$1,price=$2,emoji=$3,descr=$4,tags=$5,badge=$6,image=$7,stock=$8
       WHERE id=$9 AND shop_id=$10`,
      [name, price, emoji, descr, JSON.stringify(tags || []), badge, image || null, parseInt(stock,10)||0, req.params.id, req.shopId]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await q('DELETE FROM products WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── UPLOAD ẢNH (sản phẩm) — nhận base64, lưu file, trả về URL ──────────
app.post('/api/upload-image', auth, async (req, res) => {
  try {
    const { data } = req.body;
    const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i.exec(data || '');
    if (!m) return res.status(400).json({ error: 'Invalid image format — accepted: PNG, JPG, WEBP, GIF' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image too large — maximum size is 5 MB' });
    const ext  = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();

    // Fix #4: nếu S3/R2 đã bật (set env S3_BUCKET) → đẩy lên CDN, trả URL tuyệt đối.
    // Chưa bật → giữ nguyên hành vi cũ: ghi file vào public/uploads.
    if (storage.isEnabled()) {
      const url = await storage.putImage(buf, ext, req.shopId);
      if (url) return res.json({ url });
    }
    const fs = require('fs');
    const dir = path.join(__dirname, 'public', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    const name = `${req.shopId}_${Date.now()}_${Math.floor(Math.random()*1e4)}.${ext}`;
    fs.writeFileSync(path.join(dir, name), buf);
    res.json({ url: `/uploads/${name}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RULES ────────────────────────────────────────────────────────────
app.get('/api/rules', auth, async (req, res) => {
  try {
    res.json(await all('SELECT * FROM rules WHERE shop_id=$1 ORDER BY id', [req.shopId]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rules', auth, async (req, res) => {
  try {
    const { keyword, reply } = req.body;
    if (!keyword || !reply) return res.status(400).json({ error: 'Keyword and reply text are required' });
    const lim = await checkPlanLimit(req.shopId, 'rules');
    if (!lim.ok) return res.status(403).json({ error: `The ${lim.plan} plan allows a maximum of ${lim.limit} ${RESOURCE_LABEL.rules} (currently: ${lim.current}/${lim.limit}). Upgrade your plan to continue.`, limit_exceeded: true, resource: 'rules' });
    const r = await one(
      'INSERT INTO rules (shop_id,keyword,reply,active) VALUES ($1,$2,$3,TRUE) RETURNING id',
      [req.shopId, keyword, reply]
    );
    res.json({ id: r.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/rules/:id', auth, async (req, res) => {
  try {
    const { keyword, reply, active } = req.body;
    await q(
      'UPDATE rules SET keyword=$1,reply=$2,active=$3 WHERE id=$4 AND shop_id=$5',
      [keyword, reply, active, req.params.id, req.shopId]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rules/:id', auth, async (req, res) => {
  try {
    await q('DELETE FROM rules WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BOT CONFIG ───────────────────────────────────────────────────────
app.get('/api/bot', auth, async (req, res) => {
  try {
    let cfg = await one('SELECT * FROM bot_config WHERE shop_id=$1', [req.shopId]);
    if (!cfg) {
      await q('INSERT INTO bot_config (shop_id) VALUES ($1) ON CONFLICT DO NOTHING', [req.shopId]);
      cfg = await one('SELECT * FROM bot_config WHERE shop_id=$1', [req.shopId]);
    }
    cfg.quick_btns = JSON.parse(cfg.quick_btns || '[]');
    res.json(cfg);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/bot', auth, async (req, res) => {
  try {
    const { name, color, avatar, welcome, position, theme, quick_btns, phone, zalo } = req.body;
    await q(
      `INSERT INTO bot_config (shop_id,name,color,avatar,welcome,position,theme,quick_btns,phone,zalo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT(shop_id) DO UPDATE SET
         name=EXCLUDED.name, color=EXCLUDED.color, avatar=EXCLUDED.avatar,
         welcome=EXCLUDED.welcome, position=EXCLUDED.position, theme=EXCLUDED.theme,
         quick_btns=EXCLUDED.quick_btns, phone=EXCLUDED.phone, zalo=EXCLUDED.zalo`,
      [req.shopId, name, color, avatar, welcome, position, theme,
       JSON.stringify(quick_btns || []), phone, zalo]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STATS ────────────────────────────────────────────────────────────
app.get('/api/stats', auth, async (req, res) => {
  try {
    const sid = req.shopId;
    const [total, closed, products, today, botReplies] = await Promise.all([
      one('SELECT COUNT(*) n FROM customers WHERE shop_id=$1', [sid]),
      one("SELECT COUNT(*) n FROM customers WHERE shop_id=$1 AND status='close'", [sid]),
      one('SELECT COUNT(*) n FROM products WHERE shop_id=$1', [sid]),
      one('SELECT COUNT(*) n FROM customers WHERE shop_id=$1 AND DATE(created_at)=CURRENT_DATE', [sid]),
      one('SELECT COALESCE(SUM(hits),0) n FROM rules WHERE shop_id=$1', [sid]),
    ]);
    // Message stats per channel
    const channels = await all(
      "SELECT channel, COUNT(*) cnt FROM messages WHERE shop_id=$1 AND direction='in' GROUP BY channel",
      [sid]
    );
    // Recent 7 days customers
    const weekly = await all(
      `SELECT DATE(created_at) d, COUNT(*) cnt FROM customers
       WHERE shop_id=$1 AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at) ORDER BY d`,
      [sid]
    );
    res.json({
      total: +total.n, closed: +closed.n, products: +products.n,
      today: +today.n, botReplies: +botReplies.n,
      channels, weekly
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CHANNELS (FB / Zalo tokens) ──────────────────────────────────────
app.get('/api/channels', auth, adminOnly, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM channel_tokens WHERE shop_id=$1', [req.shopId]);
    const result = {};
    // Mask page_token (bí mật) — chỉ hiện 4 ký tự cuối + cờ đã cấu hình.
    rows.forEach(r => {
      result[r.channel] = {
        page_token: r.page_token ? '••••••••' + r.page_token.slice(-4) : '',
        has_token:  !!r.page_token,
        verify_token: r.verify_token,
        auto_comment: !!r.auto_comment,
        app_id:     r.app_id || '',
        has_secret: !!r.app_secret,   // Fix #1: chỉ báo đã cấu hình, không lộ secret
      };
    });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/channels/:channel', auth, adminOnly, async (req, res) => {
  try {
    const { page_token, verify_token, auto_comment, app_secret, app_id } = req.body;
    const channel = req.params.channel;
    if (!['facebook', 'zalo', 'telegram', 'whatsapp'].includes(channel))
      return res.status(400).json({ error: 'channel phải là facebook, zalo, telegram hoặc whatsapp' });
    // Giữ nguyên token cũ nếu client gửi rỗng hoặc giá trị đã mask.
    let tokenToSave = page_token;
    if (!page_token || /^•+/.test(page_token)) {
      const ex = await one('SELECT page_token FROM channel_tokens WHERE shop_id=$1 AND channel=$2', [req.shopId, channel]);
      tokenToSave = ex?.page_token || null;
    }
    // Fix #1: giữ app_secret cũ nếu client không gửi (rỗng hoặc đã mask) để khỏi xoá nhầm.
    let secretToSave = app_secret;
    if (app_secret === undefined || app_secret === '' || /^•+/.test(app_secret || '')) {
      const ex = await one('SELECT app_secret FROM channel_tokens WHERE shop_id=$1 AND channel=$2', [req.shopId, channel]);
      secretToSave = ex?.app_secret || null;
    }
    await q(
      `INSERT INTO channel_tokens (shop_id,channel,page_token,verify_token,auto_comment,app_secret,app_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(shop_id,channel) DO UPDATE SET
         page_token=EXCLUDED.page_token, verify_token=EXCLUDED.verify_token,
         auto_comment=EXCLUDED.auto_comment, app_secret=EXCLUDED.app_secret, app_id=EXCLUDED.app_id`,
      [req.shopId, channel, tokenToSave, verify_token, !!auto_comment, secretToSave, app_id || null]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SHARED INBOX ─────────────────────────────────────────────────────
// Danh sách conversations (gom theo channel + sender_id)
app.get('/api/inbox', auth, async (req, res) => {
  try {
    // Lấy conversation mới nhất (DISTINCT ON lấy dòng đầu tiên sau ORDER BY)
    // Chúng ta muốn: last_in = tin nhắn 'in' mới nhất để hiện preview + unread
    //                last_any = bất kỳ tin nào mới nhất để sắp xếp danh sách
    const convs = await all(`
      WITH last_in AS (
        SELECT DISTINCT ON (channel, COALESCE(sender_id,'__web__'))
          id, shop_id, channel, sender_id, sender_name, text, direction,
          created_at, sentiment, customer_id
        FROM messages
        WHERE shop_id=$1 AND direction='in'
        ORDER BY channel, COALESCE(sender_id,'__web__'), created_at DESC
      ),
      last_any AS (
        SELECT DISTINCT ON (channel, COALESCE(sender_id,'__web__'))
          channel, COALESCE(sender_id,'__web__') AS conv_key, created_at AS last_at
        FROM messages
        WHERE shop_id=$1
        ORDER BY channel, COALESCE(sender_id,'__web__'), created_at DESC
      ),
      unread_cnt AS (
        SELECT m.channel, COALESCE(m.sender_id,'__web__') AS conv_key, COUNT(*) AS unread
        FROM messages m
        WHERE m.shop_id=$1 AND m.direction='in'
          AND NOT EXISTS (
            SELECT 1 FROM messages o
            WHERE o.shop_id=$1 AND o.channel=m.channel
              AND COALESCE(o.sender_id,'__web__') = COALESCE(m.sender_id,'__web__')
              AND o.direction='out' AND o.staff_reply=TRUE
              AND o.created_at > m.created_at
          )
        GROUP BY m.channel, COALESCE(m.sender_id,'__web__')
      )
      SELECT
        li.id, li.channel, li.sender_id, li.sender_name,
        li.text, li.direction, li.created_at, li.sentiment, li.customer_id,
        la.last_at,
        COALESCE(uc.unread, 0) AS unread,
        c.name  AS cust_name,  c.status AS cust_status,
        c.phone AS cust_phone, c.score  AS cust_score
      FROM last_in li
      JOIN last_any la ON la.channel=li.channel
                      AND la.conv_key=COALESCE(li.sender_id,'__web__')
      LEFT JOIN unread_cnt uc ON uc.channel=li.channel
                             AND uc.conv_key=COALESCE(li.sender_id,'__web__')
      LEFT JOIN customers c ON c.id=li.customer_id
      ORDER BY la.last_at DESC
    `, [req.shopId]);
    res.json(convs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Lấy tin nhắn của 1 conversation
app.get('/api/inbox/messages', auth, async (req, res) => {
  try {
    const { channel, sender_id } = req.query;
    const msgs = await all(`
      SELECT * FROM messages
      WHERE shop_id=$1 AND channel=$2
        AND COALESCE(sender_id,'__web__') = COALESCE($3,'__web__')
      ORDER BY created_at ASC LIMIT 100
    `, [req.shopId, channel, sender_id || null]);
    res.json(msgs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Staff gửi tin trả lời (tất cả kênh)
app.post('/api/inbox/reply', auth, async (req, res) => {
  try {
    const { channel, sender_id, text, customer_id } = req.body;
    if (!text) return res.status(400).json({ error: 'Thiếu nội dung' });

    // Lưu vào DB
    await q(
      `INSERT INTO messages (shop_id,channel,direction,text,sender_id,customer_id,staff_reply)
       VALUES ($1,$2,'out',$3,$4,$5,TRUE)`,
      [req.shopId, channel, text, sender_id, customer_id||null]
    );

    // Gửi thật sang kênh tương ứng
    if (channel === 'facebook' && sender_id) {
      const tok = await one("SELECT page_token FROM channel_tokens WHERE shop_id=$1 AND channel='facebook'", [req.shopId]);
      if (tok?.page_token) {
        const { default: fetch } = await import('node-fetch');
        await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${tok.page_token}`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ recipient:{id:sender_id}, message:{text} })
        }).catch(e => console.error('FB send err:', e.message));
      }
    }
    if (channel === 'zalo' && sender_id) {
      const tok = await one("SELECT page_token FROM channel_tokens WHERE shop_id=$1 AND channel='zalo'", [req.shopId]);
      if (tok?.page_token) {
        const { default: fetch } = await import('node-fetch');
        await fetch('https://openapi.zalo.me/v2.0/oa/message', {
          method: 'POST',
          headers: {'Content-Type':'application/json','access_token':tok.page_token},
          body: JSON.stringify({ recipient:{user_id:sender_id}, message:{text} })
        }).catch(e => console.error('Zalo send err:', e.message));
      }
    }

    // Ghi activity log
    if (customer_id) {
      await q('INSERT INTO activity_log (shop_id,customer_id,actor,action,detail) VALUES ($1,$2,$3,$4,$5)',
        [req.shopId, customer_id, 'staff', 'Gửi tin nhắn', `[${channel}] ${text.slice(0,80)}`]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Gán tin nhắn vào customer
app.post('/api/inbox/link-customer', auth, async (req, res) => {
  try {
    const { channel, sender_id, customer_id } = req.body;
    await q(
      `UPDATE messages SET customer_id=$1
       WHERE shop_id=$2 AND channel=$3 AND COALESCE(sender_id,'__web__')=COALESCE($4,'__web__')`,
      [customer_id, req.shopId, channel, sender_id||null]
    );
    await q('INSERT INTO activity_log (shop_id,customer_id,actor,action) VALUES ($1,$2,$3,$4)',
      [req.shopId, customer_id, 'staff', 'conversation_linked', channel]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CUSTOMER TIMELINE ─────────────────────────────────────────────────
app.get('/api/customers/:id/timeline', auth, async (req, res) => {
  try {
    const cid = req.params.id;
    // Verify customer belongs to this shop before returning any data
    const owner = await one('SELECT id FROM customers WHERE id=$1 AND shop_id=$2', [cid, req.shopId]);
    if (!owner) return res.status(404).json({ error: 'Customer not found' });
    const [msgs, events, acts] = await Promise.all([
      all(`SELECT 'message' AS type, id, direction, text, channel, sentiment, ai_reply, staff_reply, created_at
           FROM messages WHERE customer_id=$1 AND shop_id=$2 ORDER BY created_at ASC`, [cid, req.shopId]),
      all(`SELECT 'score' AS type, id, event_type AS text, score_delta, NULL AS channel, NULL AS sentiment,
                 FALSE AS ai_reply, FALSE AS staff_reply, created_at
           FROM lead_events WHERE customer_id=$1 AND shop_id=$2 ORDER BY created_at ASC`, [cid, req.shopId]),
      all(`SELECT 'activity' AS type, id, action AS text, detail AS channel, NULL AS sentiment,
                  FALSE AS ai_reply, FALSE AS staff_reply, created_at
           FROM activity_log WHERE customer_id=$1 AND shop_id=$2 ORDER BY created_at ASC`, [cid, req.shopId]),
    ]);
    const timeline = [...msgs, ...events, ...acts]
      .sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
    res.json(timeline);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI CONFIG ────────────────────────────────────────────────────────
app.get('/api/ai-config', auth, adminOnly, async (req, res) => {
  try {
    const cfg = await one('SELECT * FROM ai_config WHERE shop_id=$1', [req.shopId]);
    if (!cfg) return res.json({ provider: 'openai', model: 'gpt-4o-mini', enabled: false, api_key: '', has_key: false });
    // Never return the real API key to the client — only show masked version + configured flag.
    res.json({ ...cfg, api_key: cfg.api_key ? '••••••••' + cfg.api_key.slice(-4) : '', has_key: !!cfg.api_key });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/ai-config', auth, adminOnly, async (req, res) => {
  try {
    const { provider, api_key, model, system_prompt, enabled } = req.body;
    // Giữ key cũ nếu ô vẫn là giá trị mask (••••); để TRỐNG hẳn = xoá key.
    let keyToSave = api_key || '';
    if (/^•+/.test(keyToSave)) {
      const ex = await one('SELECT api_key FROM ai_config WHERE shop_id=$1', [req.shopId]);
      keyToSave = ex?.api_key || '';
    }
    // Tự nhận diện nhà cung cấp theo đầu key (AIza→gemini, sk-→openai); fallback theo lựa chọn người dùng.
    const finalProvider = detectProvider(keyToSave) || provider || 'openai';
    const finalModel    = modelForProvider(finalProvider, model);
    await q(
      `INSERT INTO ai_config (shop_id,provider,api_key,model,system_prompt,enabled)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(shop_id) DO UPDATE SET
         provider=EXCLUDED.provider, api_key=EXCLUDED.api_key,
         model=EXCLUDED.model, system_prompt=EXCLUDED.system_prompt, enabled=EXCLUDED.enabled`,
      [req.shopId, finalProvider, keyToSave, finalModel, system_prompt, enabled||false]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai-config/test', auth, adminOnly, async (req, res) => {
  try {
    const { text } = req.body;
    const products = await all('SELECT * FROM products WHERE shop_id=$1', [req.shopId]);
    const shop     = await one('SELECT * FROM shops WHERE id=$1', [req.shopId]);
    const reply = await callAI(req.shopId, text || 'Giá sản phẩm bao nhiêu?', products, shop?.name || 'Shop');
    if (!reply) return res.json({ ok: false, message: 'AI is not configured or the API key is invalid' });
    res.json({ ok: true, reply });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── LEAD SCORING ─────────────────────────────────────────────────────
app.get('/api/leads', auth, async (req, res) => {
  try {
    const leads = await all(
      `SELECT c.*, (
         SELECT COUNT(*) FROM messages m WHERE m.customer_id=c.id AND m.direction='in'
       ) msg_count
       FROM customers c WHERE c.shop_id=$1
       ORDER BY c.score DESC NULLS LAST LIMIT 20`,
      [req.shopId]
    );
    res.json(leads);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leads/:id/score', auth, async (req, res) => {
  try {
    const { event_type, score_delta } = req.body;
    const cust = await one('SELECT id FROM customers WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
    if (!cust) return res.status(404).json({ error: 'Customer not found' });
    await q(
      'INSERT INTO lead_events (shop_id,customer_id,event_type,score_delta) VALUES ($1,$2,$3,$4)',
      [req.shopId, req.params.id, event_type, score_delta]
    );
    await q('UPDATE customers SET score=score+$1 WHERE id=$2 AND shop_id=$3',
      [score_delta, req.params.id, req.shopId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sentiment-stats', auth, async (req, res) => {
  try {
    const rows = await all(
      `SELECT sentiment, COUNT(*) cnt FROM messages
       WHERE shop_id=$1 AND direction='in' AND sentiment IS NOT NULL
       GROUP BY sentiment`,
      [req.shopId]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Billing routes → xem src/routes/billing.js


// ── AUTO-REPLY ENGINE (Keyword → AI fallback) ────────────────────────
async function generateReply(shopId, text, { customerId } = {}) {
  const t        = (text || '').toLowerCase();
  const rules    = await all('SELECT * FROM rules WHERE shop_id=$1 AND active=TRUE', [shopId]);
  const products = await all('SELECT * FROM products WHERE shop_id=$1', [shopId]);
  const shop     = await one('SELECT * FROM shops WHERE id=$1', [shopId]);

  // 1. Khớp keyword rule
  for (const r of rules) {
    const keywords = r.keyword.split('|').map(k => k.trim().toLowerCase());
    if (keywords.some(k => k && t.includes(k))) {
      await q('UPDATE rules SET hits=hits+1 WHERE id=$1', [r.id]);
      let reply = r.reply;
      if (products.length) {
        reply = reply
          .replace(/{tên_sp}/g, products[0].name || '')
          .replace(/{giá_sp}/g, products[0].price || '');
        if (reply.includes('{product_list}')) {
          const list = products.slice(0, 5)
            .map(p => `${p.emoji || '📦'} ${p.name} – ${p.price}đ`).join('\n');
          reply = reply.replace(/{product_list}/g, '\n' + list);
        }
      }
      return { reply, aiGenerated: false };
    }
  }

  // 2. Khớp tên sản phẩm
  for (const p of products) {
    const words = (p.name || '').toLowerCase().split(' ').filter(w => w.length > 3);
    if (words.some(w => t.includes(w)))
      return { reply: `📦 ${p.name}\n💰 Price: ${p.price}\n${p.descr || ''}\n\nWould you like to place an order? 😊`, aiGenerated: false };
  }

  // 3. AI fallback (nếu đã cấu hình)
  const aiReply = await callAI(shopId, text, products, shop?.name || 'Shop');
  if (aiReply) return { reply: aiReply, aiGenerated: true };

  // 4. Fallback mặc định
  const fb = [
    'Thanks for reaching out! Ask me about pricing, products, shipping, or warranty 💬',
    "We're here to help! What can I assist you with today? 😊",
  ];
  return { reply: fb[Math.floor(Math.random() * fb.length)], aiGenerated: false };
}

// ── IN-MEMORY TTL CACHE (không cần Redis, dùng cho 300+ shops) ──────
// Giảm ~70% DB queries cho widget endpoints (shopByApiKey + bot_config + rules + products)
const _cache = new Map();
function cacheGet(key) {
  const e = _cache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { _cache.delete(key); return null; }
  return e.val;
}
function cacheSet(key, val, ttlMs = 60_000) {
  _cache.set(key, { val, exp: Date.now() + ttlMs });
}
function cacheInvalidate(pattern) {
  for (const k of _cache.keys()) { if (k.includes(pattern)) _cache.delete(k); }
}
// Tự dọn cache mỗi 5 phút (tránh memory leak nếu nhiều shop)
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of _cache.entries()) { if (now > e.exp) _cache.delete(k); }
}, 5 * 60_000);

async function shopByApiKey(apiKey) {
  const hit = cacheGet(`shop:${apiKey}`);
  if (hit) return hit;
  const shop = await one('SELECT * FROM shops WHERE api_key=$1', [apiKey]);
  if (shop) cacheSet(`shop:${apiKey}`, shop, 5 * 60_000); // cache 5 phút
  return shop;
}

// ── WIDGET PUBLIC ENDPOINTS ──────────────────────────────────────────
app.get('/widget/:apiKey/config.js', async (req, res) => {
  try {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop) return res.status(404).send('// shop not found');

    // Cache toàn bộ config.js response trong 2 phút (giảm 3 DB queries → 0)
    const cfgKey = `cfg:${req.params.apiKey}`;
    const cachedCfg = cacheGet(cfgKey);
    if (cachedCfg) { res.type('application/javascript'); return res.send(cachedCfg); }

    const cfg      = (await one('SELECT * FROM bot_config WHERE shop_id=$1', [shop.id])) || {};
    const rules    = await all('SELECT keyword,reply FROM rules WHERE shop_id=$1 AND active=TRUE', [shop.id]);
    const products = await all('SELECT emoji,name,price,descr,image FROM products WHERE shop_id=$1', [shop.id]);

    const config = {
      apiKey: req.params.apiKey,
      backendBase: `${req.protocol}://${req.get('host')}`, // so widget can build absolute image URLs
      name: cfg.name || shop.name,
      color: cfg.color || '#7c3aed',
      avatar: cfg.avatar || '🤖',
      welcome: cfg.welcome || 'Xin chào! 👋',
      position: cfg.position || 'right',
      theme: cfg.theme || 'light',
      quickBtns: JSON.parse(cfg.quick_btns || '["💰 Giá","📦 Còn hàng?","🚚 Ship","🛡️ Bảo hành"]'),
      phone: cfg.phone || '',
      zalo: cfg.zalo || '',
      products: products.map(p => ({ emoji: p.emoji, name: p.name, price: p.price, desc: p.descr, image: p.image })),
      rules: rules.map(r => ({ trigger: r.keyword, reply: r.reply })),
      replyEndpoint: `/widget/${req.params.apiKey}/reply`,
    };
    const jsResponse = `window.SALESKIT_CONFIG = ${JSON.stringify(config)};`;
    cacheSet(cfgKey, jsResponse, 2 * 60_000); // cache 2 phút
    res.type('application/javascript');
    res.send(jsResponse);
  } catch (e) { res.status(500).send(`// error: ${e.message}`); }
});

app.post('/widget/:apiKey/reply', widgetLimiter, async (req, res) => {
  try {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const { text, channel, customer_id } = req.body;

    // Phân tích sắc thái
    const sentiment = analyzeSentiment(text);

    // Tính điểm lead
    const scoreEvents = scoreMessage(text);

    // Sinh câu trả lời (keyword → AI → fallback)
    const { reply, aiGenerated } = await generateReply(shop.id, text, { customerId: customer_id });

    // Lưu messages với sentiment, sender_id, customer_id
    await q('INSERT INTO messages (shop_id,channel,direction,text,sentiment,customer_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [shop.id, channel || 'web', 'in', text, sentiment, customer_id || null]);
    await q('INSERT INTO messages (shop_id,channel,direction,text,ai_reply,customer_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [shop.id, channel || 'web', 'out', reply, aiGenerated, customer_id || null]);

    // Cập nhật điểm + sentiment khách hàng
    if (customer_id) await updateCustomerScore(customer_id, scoreEvents, sentiment);

    // Phát real-time tới dashboard
    emit(shop.id, 'message:new', {
      channel: channel || 'web', text, sentiment, reply,
      customer_id, score_events: scoreEvents.length
    });

    // THẺ SẢN PHẨM CÓ NÚT — nếu khách hỏi xem hàng/sản phẩm thì gửi kèm danh sách
    let products = null;
    if (/sản phẩm|xem hàng|có gì|mẫu nào|danh sách|menu|xem sp|các mẫu|sp nào/i.test(text || '')) {
      const rows = await all('SELECT id,emoji,name,price,descr,image FROM products WHERE shop_id=$1 ORDER BY id DESC LIMIT 8', [shop.id]);
      if (rows.length) products = rows.map(p => ({ id: p.id, emoji: p.emoji, name: p.name, price: p.price, desc: p.descr, image: p.image }));
    }

    res.json({ reply, sentiment, scoreEvents, aiGenerated, products });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Team routes → xem src/routes/team.js

// ── REPORTS — CONVERSION FUNNEL ───────────────────────────────────────
app.get('/api/reports/funnel', auth, async (req, res) => {
  try {
    const sid = req.shopId;

    // Count by current status
    const counts = await one(`
      SELECT
        COUNT(*)                                           AS total,
        COUNT(*) FILTER (WHERE status='new')               AS "new",
        COUNT(*) FILTER (WHERE status='hot')               AS hot,
        COUNT(*) FILTER (WHERE status='close')             AS close,
        COUNT(*) FILTER (WHERE status='cold')              AS cold,
        COUNT(*) FILTER (WHERE score >= 80)                AS high_score,
        ROUND(AVG(score)::NUMERIC,1)                       AS avg_score
      FROM customers WHERE shop_id=$1
    `, [sid]);

    // Đếm transitions từ activity_log
    const transitions = await all(`
      SELECT detail, COUNT(*) cnt FROM activity_log
      WHERE shop_id=$1 AND action='status_change'
      GROUP BY detail ORDER BY cnt DESC
    `, [sid]);

    // Phân tích theo tuần (7 ngày qua)
    const weekly = await all(`
      SELECT DATE(created_at) d, status, COUNT(*) cnt
      FROM customers WHERE shop_id=$1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), status ORDER BY d
    `, [sid]);

    // Tỉ lệ chuyển đổi
    const total  = +counts.total || 1;
    const hot    = +counts.hot   + +counts.close;  // ever reached hot
    const closed = +counts.close;

    res.json({
      counts: {
        total:    +counts.total,
        new:      +counts.new,
        hot:      +counts.hot,
        close:    +counts.close,
        cold:     +counts.cold,
        high_score: +counts.high_score,
        avg_score:  +counts.avg_score || 0,
      },
      rates: {
        new_to_hot:   total   ? Math.round((+counts.hot + closed) / total * 100) : 0,
        hot_to_close: hot > 0 ? Math.round(closed / hot * 100)                  : 0,
        overall:      total   ? Math.round(closed / total * 100)                 : 0,
      },
      transitions,
      weekly,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DEV TOOLS — Simulate incoming message (test luồng webhook) ────────
app.post('/api/dev/simulate', auth, async (req, res) => {
  try {
    const { channel = 'web', sender_id, sender_name, text } = req.body;
    if (!text) return res.status(400).json({ error: 'Thiếu text' });

    const sid      = sender_id || `sim_${Date.now()}`;
    const sname    = sender_name || `Test_${channel}`;
    const sentiment = analyzeSentiment(text);
    const scoreEvs  = scoreMessage(text);
    const { reply, aiGenerated } = await generateReply(req.shopId, text);

    await q(
      `INSERT INTO messages (shop_id,channel,direction,text,sentiment,sender_id,sender_name)
       VALUES ($1,$2,'in',$3,$4,$5,$6)`,
      [req.shopId, channel, text, sentiment, sid, sname]
    );
    await q(
      `INSERT INTO messages (shop_id,channel,direction,text,ai_reply,sender_id)
       VALUES ($1,$2,'out',$3,$4,$5)`,
      [req.shopId, channel, reply, aiGenerated, sid]
    );

    // Phát WebSocket — đây là điểm cốt lõi cần test
    emit(req.shopId, 'message:new', {
      channel, text, sentiment, reply, sender_id: sid,
      score_events: scoreEvs.length, aiGenerated,
    });

    res.json({ ok: true, reply, sentiment, sender_id: sid, aiGenerated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HEALTH ───────────────────────────────────────────────────────────
// Health check cho Railway (không dùng / nữa vì đã có landing page)
app.get('/health', async (req, res) => {
  try {
    const r = await one('SELECT COUNT(*) n FROM shops');
    res.json({ status: 'ok', service: 'SalesKit Pro', db: 'postgresql', shops: +r.n });
  } catch (e) { res.status(500).json({ status: 'error', error: e.message }); }
});

// ── START ─────────────────────────────────────────────────────────────
// ── ROUTE MODULES ───────────────────────────────────────────────────────
require('./src/routes/billing')(app, { auth, adminOnly, emit });
require('./src/routes/team')(app,    { auth, adminOnly, emit });
require('./src/routes/super')(app,   { superAuth, emit, superGuard, registerLimiter });
require('./src/routes/portal')(app,  { auth, adminOnly, customerAuth, customerGuard });
require('./src/routes/copilot')(app, { auth });
require('./src/routes/orders')(app,  { auth, emit });
require('./src/routes/broadcast')(app, { auth, adminOnly, emit });

module.exports = { app, generateReply, shopByApiKey };

const { registerWebhooks } = require('./webhook');
registerWebhooks(app, { generateReply, shopByApiKey, emit });

// Super Admin routes → xem src/routes/super.js

// Portal routes → xem src/routes/portal.js

// Landing page at root, dashboard at /app
app.get('/',    (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ── 404 for unknown API routes (JSON, not the SPA) ────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ── Centralized error handler — log full detail, never leak internals ──
app.use((err, req, res, next) => {
  console.error('[unhandled]', err.stack || err.message);
  if (res.headersSent) return next(err);
  const body = process.env.NODE_ENV === 'production'
    ? { error: 'Internal server error' }
    : { error: err.message };
  res.status(err.status || 500).json(body);
});

// ── Fix #5: TỰ HẠ GÓI KHI HẾT HẠN ───────────────────────────────────────
// Đơn 'active' quá expires_at → đánh dấu 'expired'. Shop nào không còn đơn
// active hợp lệ → hạ về 'free'. Chạy lúc khởi động và lặp lại mỗi giờ.
async function expireSubscriptions() {
  try {
    const expired = await all(
      "UPDATE billing SET status='expired' WHERE status='active' AND expires_at IS NOT NULL AND expires_at < NOW() RETURNING shop_id",
    );
    if (!expired.length) return;
    const shopIds = [...new Set(expired.map(r => r.shop_id))];
    for (const sid of shopIds) {
      // Nếu shop vẫn còn 1 đơn active chưa hết hạn (gia hạn sớm) thì giữ nguyên gói.
      const stillActive = await one(
        "SELECT plan FROM billing WHERE shop_id=$1 AND status='active' AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY expires_at DESC LIMIT 1",
        [sid]
      );
      const newPlan = stillActive?.plan || 'free';
      await q('UPDATE shops SET plan=$1 WHERE id=$2', [newPlan, sid]);
      await q('INSERT INTO activity_log (shop_id,actor,action,detail) VALUES ($1,$2,$3,$4)',
        [sid, 'system', 'Gói hết hạn', `Tự động chuyển sang gói: ${newPlan}`]);
      try { emit(sid, 'billing:expired', { plan: newPlan }); } catch {}
    }
    console.log(`[Billing] ⏰ Đã xử lý hết hạn cho ${shopIds.length} shop.`);
  } catch (e) {
    console.error('[Billing] expireSubscriptions error:', e.message);
  }
}

if (require.main === module) {
  initSchema().then(() => {
    expireSubscriptions();                                   // chạy ngay khi khởi động
    setInterval(expireSubscriptions, 60 * 60 * 1000).unref?.(); // và lặp lại mỗi giờ
    httpServer.listen(PORT, () => {
      console.log(`🚀 SalesKit Pro (PostgreSQL) — http://localhost:${PORT}`);
      console.log(`   DB:      postgresql://localhost/saleskit_pro`);
      console.log(`   API:     /api/*`);
      console.log(`   Widget:  /widget/:apiKey/config.js`);
      console.log(`   Webhook: /webhook/:apiKey/facebook | zalo`);
    });
  }).catch(e => {
    console.error('❌ Startup failed:', e.message);
    process.exit(1);
  });
}

