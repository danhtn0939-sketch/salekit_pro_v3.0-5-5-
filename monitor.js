// ── CONFIG ────────────────────────────────────────────────────────────
const BASE = window.location.protocol === 'file:' ? 'http://localhost:4000' : window.location.origin;

// ── i18n — BILINGUAL VI / EN ──────────────────────────────────────────
const LANGS = {
  vi: {
    dashboard:'Dashboard', customers:'Khách hàng', kanban:'Kanban Board', orders:'Đơn hàng',
    inbox:'Hộp thư chung', addcust:'Thêm khách', botconfig:'Preview Bot',
    products:'Data sản phẩm', autorules:'Auto Reply Rules', embed:'Nhúng Widget',
    channels:'Kênh kết nối', funnel:'Phễu chuyển đổi', team:'Quản lý Team',
    aiconfig:'AI Agent Config', leads:'Lead Scoring', billing:'Billing & Gói',
    settings:'Cài đặt',
    'btn.add_customer':'➕ Thêm khách', 'btn.export_csv':'📥 Xuất CSV',
    'btn.save':'💾 Lưu', 'btn.cancel':'Hủy', 'btn.delete':'🗑️ Xóa',
    'btn.login':'Đăng nhập', 'btn.logout':'← Đăng xuất',
    'label.name':'Họ tên', 'label.phone':'Điện thoại', 'label.email':'Email',
    'label.status':'Trạng thái', 'label.source':'Nguồn', 'label.note':'Ghi chú',
    'label.product':'Sản phẩm quan tâm',
    'status.new':'🆕 Mới','status.hot':'🔥 Hot','status.close':'✅ Chốt','status.cold':'❄️ Lạnh',
    'section.overview':'Tổng quan','section.chatbot':'Chat Bot',
    'section.deploy':'Nhúng & Deploy','section.report':'Báo cáo & Team',
    'section.ai':'AI & Tự động hóa','section.biz':'Kinh doanh',
    'pay.qr':'🏦 Thanh toán VietQR','pay.stripe':'💳 Pay with Stripe (USD)',
    'pay.or':'— hoặc —',
    'ch.not_connected':'● Chưa kết nối','ch.connected':'● Đã kết nối',
    'search':'🔍 Tìm kiếm tên, SĐT, email...',
  },
  en: {
    dashboard:'Dashboard', customers:'Customers', kanban:'Kanban Board', orders:'Orders',
    inbox:'Shared Inbox', addcust:'Add Customer', botconfig:'Bot Preview',
    products:'Products', autorules:'Auto Reply Rules', embed:'Embed Widget',
    channels:'Channels', funnel:'Conversion Funnel', team:'Team',
    aiconfig:'AI Config', leads:'Lead Scoring', billing:'Billing & Plans',
    settings:'Settings',
    'btn.add_customer':'➕ Add Customer', 'btn.export_csv':'📥 Export CSV',
    'btn.save':'💾 Save', 'btn.cancel':'Cancel', 'btn.delete':'🗑️ Delete',
    'btn.login':'Login', 'btn.logout':'← Logout',
    'label.name':'Full Name', 'label.phone':'Phone', 'label.email':'Email',
    'label.status':'Status', 'label.source':'Source', 'label.note':'Note',
    'label.product':'Interested Product',
    'status.new':'🆕 New','status.hot':'🔥 Hot','status.close':'✅ Closed','status.cold':'❄️ Cold',
    'section.overview':'Overview','section.chatbot':'Chat Bot',
    'section.deploy':'Embed & Deploy','section.report':'Reports & Team',
    'section.ai':'AI & Automation','section.biz':'Business',
    'pay.qr':'🏦 Pay via VietQR (VND)','pay.stripe':'💳 Pay with Stripe (USD)',
    'pay.or':'— or —',
    'ch.not_connected':'● Not connected','ch.connected':'● Connected',
    'search':'🔍 Search name, phone, email...',
  }
};
let currentLang = localStorage.getItem('sk_lang') || (navigator.language.startsWith('vi') ? 'vi' : 'en');

function t(key) { return LANGS[currentLang]?.[key] || LANGS.vi[key] || key; }

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.placeholder !== undefined && el.tagName === 'INPUT') el.placeholder = t(key);
    else el.innerHTML = t(key);
  });
  document.getElementById('langBtn').textContent = currentLang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI';
  // Update status labels
  document.querySelectorAll('.cs-inactive').forEach(el => {
    if (!el.dataset.i18nDone) el.textContent = t('ch.not_connected');
  });
}

function toggleLang() {
  currentLang = currentLang === 'vi' ? 'en' : 'vi';
  localStorage.setItem('sk_lang', currentLang);
  applyLang();
}

// ── AUTO CURRENCY DETECTION ───────────────────────────────────────────
const CURRENCY_MAP = {
  'Asia/Ho_Chi_Minh':'VND','Asia/Bangkok':'THB','Asia/Singapore':'SGD',
  'Asia/Tokyo':'JPY','Asia/Seoul':'KRW','Asia/Shanghai':'CNY',
  'Asia/Kolkata':'INR','Asia/Dubai':'AED','Asia/Jakarta':'IDR',
  'America/New_York':'USD','America/Los_Angeles':'USD','America/Chicago':'USD',
  'Europe/London':'GBP','Europe/Paris':'EUR','Europe/Berlin':'EUR',
  'Australia/Sydney':'AUD','Pacific/Auckland':'NZD',
};
const RATE_TO_USD = {
  VND:25000, THB:35, SGD:1.35, JPY:150, KRW:1300, CNY:7.2,
  INR:83, AED:3.67, IDR:15700, USD:1, GBP:0.79, EUR:0.92,
  AUD:1.53, NZD:1.64,
};
const CURRENCY_SYMBOL = {
  VND:'đ', THB:'฿', SGD:'S$', JPY:'¥', KRW:'₩', CNY:'¥',
  INR:'₹', AED:'AED', IDR:'Rp', USD:'$', GBP:'£', EUR:'€',
  AUD:'A$', NZD:'NZ$',
};

function detectCurrency() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return CURRENCY_MAP[tz] || (navigator.language === 'vi' ? 'VND' : 'USD');
}

const userCurrency = detectCurrency();

function fmoney(amount_vnd) {
  if (userCurrency === 'VND') {
    return (+amount_vnd || 0).toLocaleString('vi-VN') + 'đ';
  }
  const rate = RATE_TO_USD[userCurrency] || 1;
  const rateVnd = RATE_TO_USD['VND'] || 25000;
  const converted = (+amount_vnd || 0) / rateVnd * rate;
  const sym = CURRENCY_SYMBOL[userCurrency] || userCurrency;
  return sym + converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ── MOBILE SIDEBAR ────────────────────────────────────────────────────
function toggleSidebar() {
  const sb  = document.querySelector('.sidebar');
  const ov  = document.getElementById('sidebarOverlay');
  const btn = document.getElementById('hamburgerBtn');
  const open = sb.classList.toggle('mobile-open');
  ov.classList.toggle('on', open);
  btn.classList.toggle('open', open);
}
function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('on');
  document.getElementById('hamburgerBtn').classList.remove('open');
}
// Đóng sidebar khi chọn menu trên mobile
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
});
let token = localStorage.getItem('sk_token');
let shopInfo = null;
let myUserId = +localStorage.getItem('sk_uid') || null;
let custs = [], prods = [], rules = [], botCfg = {}, quickBtns = [];
let botMsgs = [];
let weekChart = null;

// ── API helper ────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (data.limit_exceeded) {
      toastLimitExceeded(data.error);
      throw new Error(data.error);
    }
    throw new Error(data.error || `HTTP ${r.status}`);
  }
  return data;
}

// ── UTILS ─────────────────────────────────────────────────────────────

// Escape user-generated content trước khi đưa vào innerHTML (chống XSS)
function sanitizeHTML(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

// Debounce — tránh gọi hàm liên tục khi gõ phím
function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
const debouncedRenderCust = debounce(renderCust, 250);

// withLoading — disable nút khi đang xử lý, tránh double-submit
async function withLoading(btn, fn) {
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳';
  try { await fn(); }
  finally { btn.disabled = false; btn.innerHTML = orig; }
}

// Theme toggle — Light / Dark
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  document.getElementById('themeBtn').textContent = isLight ? '🌞' : '🌙';
  localStorage.setItem('sk_theme', isLight ? 'light' : 'dark');
}
(function applyTheme() {
  if (localStorage.getItem('sk_theme') === 'light') {
    document.body.classList.add('light');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = '🌞';
  }
})();

// Apply language on page load
document.addEventListener('DOMContentLoaded', () => applyLang());

// Export CSV khách hàng
function exportCSV() {
  if (!custs.length) { toast('Chưa có dữ liệu để xuất','inf'); return; }
  const headers = ['Tên','SĐT','Email','Nguồn','Sản phẩm','Trạng thái','Điểm','Ghi chú','Ngày tạo'];
  const rows = custs.map(c => [
    c.name, c.phone||'', c.email||'', c.source||'',
    c.product||'', c.status, c.score||0, c.note||'', fd(c.created_at)
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `khach-hang-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  toast(`📥 Đã xuất ${custs.length} khách hàng`);
}

function toast(msg, type='ok') {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast' + (type==='err'?' err':type==='inf'?' inf':'');
  t.innerHTML = msg;
  w.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}
function toastLimitExceeded(msg) {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast err';
  t.style.cssText = 'max-width:340px;cursor:pointer';
  t.innerHTML = `⛔ ${msg}<br><span style="font-size:11px;text-decoration:underline;opacity:.85">👆 Nhấn để nâng cấp gói →</span>`;
  t.onclick = () => { t.remove(); go('billing'); };
  w.appendChild(t);
  setTimeout(() => t.remove(), 6000);
}
function statusLabel(s) { return {new:'🆕 Mới',hot:'🔥 Hot',close:'✅ Chốt',cold:'❄️ Lạnh'}[s]||s; }
function fd(d) { return new Date(d).toLocaleDateString('vi-VN'); }
function ft(ts) { return new Date(ts).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); }
function fmoney(n) { return (+n||0).toLocaleString('vi-VN') + 'đ'; }

// ── CLOCK ─────────────────────────────────────────────────────────────
setInterval(() => {
  const el = document.getElementById('clk');
  if (el) el.textContent = new Date().toLocaleTimeString('vi-VN');
}, 1000);

// ── AUTH ─────────────────────────────────────────────────────────────
async function login() {
  const shopId   = document.getElementById('lshop').value.trim();
  const username = document.getElementById('lu').value.trim();
  const password = document.getElementById('lp').value;
  if (!shopId || !username || !password) { toast('Vui lòng điền đầy đủ thông tin','err'); return; }
  try {
    const data = await api('POST', '/api/auth/login', { shopId, username, password });
    token      = data.token;
    shopInfo   = data.shop;
    myUserId   = data.user.id;
    localStorage.setItem('sk_token', token);
    localStorage.setItem('sk_shop',  JSON.stringify(data.shop));
    localStorage.setItem('sk_uid',   data.user.id);
    document.getElementById('loginOv').style.display = 'none';
    document.getElementById('userLabel').textContent = data.user.username;
    document.getElementById('userAv').textContent    = data.user.username[0].toUpperCase();
    document.getElementById('shopLabel').textContent = data.shop.name;
    
    
    updateWebhookUrls(data.shop.api_key);
    initSocket(data.shop.id);
    applyLang();
    showCopilotFab(true);
    autoOpenCopilotOnLogin();
    toast('✅ ' + (currentLang === 'en' ? 'Login successful' : 'Đăng nhập thành công'));
    await init();
  } catch (e) { toast('❌ ' + e.message, 'err'); }
}

function logout() {
  token = null; shopInfo = null; myUserId = null;
  localStorage.removeItem('sk_token');
  localStorage.removeItem('sk_shop');
  localStorage.removeItem('sk_uid');
  document.getElementById('loginOv').style.display = 'flex';
  showCopilotFab(false);
  if (typeof closeCopilotPanel === 'function') closeCopilotPanel();
}

async function changePw() {
  const o = document.getElementById('opw').value;
  const n = document.getElementById('npw').value;
  if (!o || !n) { toast('Nhập đủ mật khẩu cũ và mới','err'); return; }
  try {
    await api('PUT','/api/auth/password',{oldPassword:o,newPassword:n});
    toast('✅ Đã đổi mật khẩu');
    document.getElementById('opw').value='';
    document.getElementById('npw').value='';
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function loadContactInfo() {
  try {
    const r = await fetch(`${BASE}/api/platform-contact`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    const c = await r.json();
    const el = document.getElementById('contactInfoCard');
    if (!el) return;
    if (!c.email && !c.phone && !c.note && !c.telegram && !c.whatsapp) {
      el.innerHTML = '<div class="empty">Chưa có thông tin liên hệ</div>';
      return;
    }
    const row = (icon, label, val) => val ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px">
        <span style="width:84px;flex-shrink:0;color:var(--muted);font-size:12px">${icon} ${label}</span>
        <span style="flex:1;color:var(--text);word-break:break-all">${sanitizeHTML(val)}</span>
        <button class="btn btn-ghost" style="padding:2px 8px;font-size:10px;flex-shrink:0" data-copy="${sanitizeHTML(val)}" onclick="copyText(this.dataset.copy)">📋</button>
      </div>` : '';
    el.innerHTML = `<div>
      ${row('📧','Email', c.email)}
      ${row('📞','Điện thoại', c.phone)}
      ${row('✈️','Telegram', c.telegram)}
      ${row('🟢','WhatsApp', c.whatsapp)}
      ${c.note ? `<div style="font-size:11px;color:var(--muted);margin-top:6px">⏰ ${sanitizeHTML(c.note)}</div>` : ''}
    </div>`;
  } catch(e) { /* silent */ }
}

// Thanh toán quốc tế do chủ app cấu hình — khách chỉ XEM & SAO CHÉP
async function loadPlatformPayments() {
  try {
    const r = await fetch(`${BASE}/api/platform-payments`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    const p = await r.json();
    const card = document.getElementById('intlPayCard');
    const body = document.getElementById('intlPayBody');
    if (!card || !body) return;
    const methods = [
      ['💳','Stripe', p.stripe],
      ['🅿️','PayPal', p.paypal],
      ['🟢','Wise', p.wise],
      ['💠','Thẻ Visa / Card', p.visa],
    ].filter(m => m[2]);
    if (!methods.length) { card.style.display = 'none'; return; }
    card.style.display = '';
    body.innerHTML =
      `<div style="font-size:11px;color:var(--muted);margin-bottom:12px">Sao chép thông tin bên dưới để thanh toán quốc tế cho gói dịch vụ (chỉ xem &amp; sao chép).</div>` +
      methods.map(([icon, label, val]) => {
        const isUrl = /^https?:\/\//i.test(val);
        const valHtml = isUrl
          ? `<a href="${sanitizeHTML(val)}" target="_blank" style="flex:1;color:var(--cyan);text-decoration:none;word-break:break-all">${sanitizeHTML(val)}</a>`
          : `<span style="flex:1;color:var(--text);word-break:break-all">${sanitizeHTML(val)}</span>`;
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:13px">
          <span style="width:130px;flex-shrink:0;color:var(--muted);font-size:12px">${icon} ${label}</span>
          ${valHtml}
          <button class="btn btn-ghost" style="padding:3px 10px;font-size:11px;flex-shrink:0" data-copy="${sanitizeHTML(val)}" onclick="copyText(this.dataset.copy)">📋 Copy</button>
        </div>`;
      }).join('');
  } catch(e) { /* silent */ }
}

function updateWebhookUrls(apiKey) {
  const urls = {
    fbWebhook:   `${BASE}/webhook/${apiKey}/facebook`,
    zaloWebhook: `${BASE}/webhook/${apiKey}/zalo`,
    tgWebhook:   `${BASE}/webhook/${apiKey}/telegram`,
    waWebhook:   `${BASE}/webhook/${apiKey}/whatsapp`,
  };
  Object.entries(urls).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el) el.value = url;
  });
  if (document.getElementById('embedPre'))
    genEmbedCode(apiKey, `${BASE}/widget/${apiKey}/config.js`);
}

// ── INIT ─────────────────────────────────────────────────────────────
async function init() {
  try {
    const [c, p, r, b, s] = await Promise.all([
      api('GET','/api/customers'),
      api('GET','/api/products'),
      api('GET','/api/rules'),
      api('GET','/api/bot'),
      api('GET','/api/stats'),
    ]);
    custs     = c;
    prods     = p;
    rules     = r;
    botCfg    = b;
    quickBtns = b.quick_btns || [];
    renderDash(s);
  } catch (e) { toast('❌ Lỗi tải dữ liệu: '+e.message,'err'); }
}

// Restore session on page load
window.addEventListener('load', async () => {
  const saved = localStorage.getItem('sk_shop');
  if (token && saved) {
    try {
      shopInfo = JSON.parse(saved);
      document.getElementById('loginOv').style.display='none';
      document.getElementById('shopLabel').textContent = shopInfo.name;
      
      
      updateWebhookUrls(shopInfo.api_key);
      initSocket(shopInfo.id);
      showCopilotFab(true);
      autoOpenCopilotOnLogin();
      await init();
    } catch (e) { logout(); }
  }
});

// ── COPILOT — Trợ lý AI hướng dẫn ─────────────────────────────────────
let copilotPage = 'dashboard';
let copilotOpen = false;
let copilotGreeted = false;

const COPILOT_QUICK = {
  channels:  ['Cách kết nối Facebook?', 'Kết nối Telegram thế nào?', 'Test bot không cần FB?'],
  aiconfig:  ['Lấy API key Gemini miễn phí?', 'Bật AI cho bot thế nào?'],
  embed:     ['Cách gắn chat lên website?'],
  products:  ['Thêm sản phẩm thế nào?'],
  autorules: ['Tạo câu trả lời tự động?'],
  botconfig: ['Đổi tên & màu khung chat?'],
  billing:   ['Cách nâng cấp gói?', 'Khách nước ngoài trả thế nào?'],
  inbox:     ['Trả lời tin nhắn ở đâu?'],
  kanban:    ['Kanban dùng thế nào?'],
  customers: ['Thêm khách hàng?'],
  leads:     ['Lead scoring là gì?'],
};

function showCopilotFab(show) {
  const fab = document.getElementById('copilotFab');
  if (fab) fab.style.display = show ? 'flex' : 'none';
}
function closeCopilotPanel() {
  copilotOpen = false;
  const p = document.getElementById('copilotPanel'); if (p) p.style.display = 'none';
}
function openCopilot() {
  const p = document.getElementById('copilotPanel');
  if (!p) return;
  copilotOpen = true;
  p.style.display = 'flex';
  if (!copilotGreeted) {
    addCopilotMsg('bot', 'Chào bạn 👋 Mình là trợ lý hướng dẫn. Bạn cần mình chỉ cách làm gì? Cứ hỏi hoặc bấm gợi ý bên dưới nhé.');
    copilotGreeted = true;
  }
  updateCopilotQuick();
  setTimeout(() => document.getElementById('copilotInput')?.focus(), 50);
}
function toggleCopilot() {
  if (copilotOpen) closeCopilotPanel(); else openCopilot();
}

// Tự mở khi vừa đăng nhập (1 lần / phiên)
function autoOpenCopilotOnLogin() {
  if (sessionStorage.getItem('cop_opened')) return;
  sessionStorage.setItem('cop_opened', '1');
  setTimeout(() => openCopilot(), 1400);
}

// Tự mở + gợi ý khi lần đầu vào trang khó (channels / aiconfig)
const COPILOT_HINT = {
  channels: 'Mình thấy bạn đang ở **Kết nối kênh** — phần này hơi kỹ thuật. Bạn muốn mình hướng dẫn kết nối **Facebook** hay **Telegram** (dễ nhất) từng bước không?',
  aiconfig: 'Bạn đang ở **Cấu hình AI**. Muốn bot trả lời thông minh hơn? Mình chỉ cách lấy **API key Gemini miễn phí** chỉ trong 1 phút nhé.',
};
function maybeAutoOpenCopilot(page) {
  if (!COPILOT_HINT[page]) return;
  if (localStorage.getItem('cop_hint_' + page)) return;
  localStorage.setItem('cop_hint_' + page, '1');
  openCopilot();
  addCopilotMsg('bot', COPILOT_HINT[page]);
}

function showCopilotRemaining(remaining, limit) {
  const el = document.getElementById('copilotRemaining');
  if (!el) return;
  if (remaining == null) { el.textContent = ''; return; } // gói trả phí: không giới hạn
  el.textContent = `Còn ${remaining}/${limit} lượt hỏi miễn phí`;
}
function addCopilotUpgrade() {
  const box = document.getElementById('copilotMsgs');
  if (!box) return;
  const div = document.createElement('div');
  div.style.cssText = 'align-self:flex-start;max-width:90%;margin-top:2px';
  div.innerHTML = `<button class="btn btn-cyan" style="padding:9px 16px;font-size:13px" onclick="closeCopilotPanel();go('billing')">⬆️ Nâng cấp ngay — chỉ từ $10–$15/tháng</button>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  const el = document.getElementById('copilotRemaining');
  if (el) el.textContent = 'Đã hết lượt miễn phí — nâng cấp để hỏi không giới hạn';
}
function updateCopilotQuick() {
  const el = document.getElementById('copilotQuick');
  if (!el) return;
  const qs = COPILOT_QUICK[copilotPage] || ['Tôi nên bắt đầu từ đâu?'];
  el.innerHTML = qs.map(q =>
    `<span onclick="askCopilot('${q.replace(/'/g,"\\'")}')" style="cursor:pointer;font-size:11px;padding:4px 9px;border:1px solid var(--cyan,#00e5ff);border-radius:14px;color:var(--cyan,#00e5ff)">${q}</span>`
  ).join('');
}
function copilotMd(t) {
  const esc = String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}
function addCopilotMsg(who, text) {
  const box = document.getElementById('copilotMsgs');
  if (!box) return null;
  const mine = who === 'me';
  const div = document.createElement('div');
  div.style.cssText = `max-width:86%;padding:9px 12px;border-radius:12px;${mine
    ? 'align-self:flex-end;background:var(--cyan,#00e5ff);color:#06121a'
    : 'align-self:flex-start;background:var(--s1,#0e0e1c);border:1px solid var(--border,#2a2a44);color:var(--text,#fff)'}`;
  div.innerHTML = copilotMd(text);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}
function askCopilot(q) {
  const inp = document.getElementById('copilotInput');
  if (inp) inp.value = q;
  sendCopilot();
}
async function sendCopilot() {
  const inp = document.getElementById('copilotInput');
  const msg = (inp?.value || '').trim();
  if (!msg) return;
  inp.value = '';
  addCopilotMsg('me', msg);
  const loading = addCopilotMsg('bot', '⟳ Đang soạn hướng dẫn...');
  try {
    const r = await api('POST','/api/copilot',{ page: copilotPage, message: msg });
    const parsed = parseCopilotAction(r.reply || '');
    if (loading) loading.innerHTML = copilotMd(parsed.text || r.reply || 'Mình chưa trả lời được, bạn thử lại nhé.');
    if (parsed.action) addCopilotActionCard(parsed.action);
    if (r.limit_reached) addCopilotUpgrade();
    else showCopilotRemaining(r.remaining, r.limit);
  } catch(e) {
    if (loading) loading.innerHTML = copilotMd('❌ ' + e.message);
  }
}

// ── COPILOT AGENT — đề xuất hành động + xác nhận + thực thi ────────────
let copilotActions = {};
function parseCopilotAction(reply) {
  let m = reply.match(/```action\s*([\s\S]*?)```/i);
  if (!m) m = reply.match(/```(?:json)?\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```/i);
  if (!m) return { text: reply, action: null };
  let action = null;
  try { action = JSON.parse(m[1].trim()); } catch { return { text: reply, action: null }; }
  if (!action || !action.tool) return { text: reply, action: null };
  return { text: reply.replace(m[0], '').trim(), action };
}
function addCopilotActionCard(action) {
  const box = document.getElementById('copilotMsgs');
  if (!box || !action.tool) return;
  const id = 'act_' + Date.now() + Math.floor(Math.random()*1000);
  copilotActions[id] = action;
  const div = document.createElement('div');
  div.className = 'cop-act';
  div.style.cssText = 'align-self:flex-start;max-width:92%;background:rgba(124,58,237,.12);border:1px solid var(--purple,#7c3aed);border-radius:12px;padding:10px 12px';
  div.innerHTML = `
    <div style="font-size:12px;margin-bottom:8px">⚙️ <strong>Mình sẽ làm hộ:</strong> ${sanitizeHTML(action.summary || action.tool)}</div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-cyan" style="padding:5px 12px;font-size:12px" onclick="executeCopilotAction('${id}', this)">✅ Đồng ý</button>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" onclick="cancelCopilotAction('${id}', this)">✖ Huỷ</button>
    </div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
function cancelCopilotAction(id, btn) {
  delete copilotActions[id];
  const card = btn.closest('.cop-act');
  if (card) card.innerHTML = '<div style="font-size:12px;color:var(--muted)">Đã huỷ.</div>';
}
async function executeCopilotAction(id, btn) {
  const action = copilotActions[id];
  if (!action) return;
  btn.disabled = true; btn.textContent = '⏳ Đang làm...';
  try {
    const r = await api('POST','/api/copilot/execute', { tool: action.tool, args: action.args });
    const card = btn.closest('.cop-act');
    if (card) card.innerHTML = `<div style="font-size:12px;color:var(--green)">✅ ${sanitizeHTML(r.message || 'Đã xong')}</div>`;
    delete copilotActions[id];
    refreshAfterAction(action.tool);
  } catch(e) {
    btn.disabled = false; btn.textContent = '✅ Đồng ý';
    addCopilotMsg('bot', '❌ ' + e.message);
  }
}
function refreshAfterAction(tool) {
  const map = { create_products:'products', create_rule:'autorules', set_bot:'botconfig', set_ai:'aiconfig', set_channel:'channels' };
  if (map[tool] && copilotPage === map[tool]) go(copilotPage);
}

// ── NAVIGATION ────────────────────────────────────────────────────────
const pgTitles = {
  dashboard:'📊 Dashboard',customers:'👥 Khách hàng',addcust:'➕ Thêm khách',
  botconfig:'🤖 Preview Bot',products:'📦 Data sản phẩm',autorules:'⚡ Auto Reply Rules',
  kanban:'🗂️ Kanban Board',orders:'🧾 Đơn hàng',inbox:'📬 Hộp thư chung',
  funnel:'📈 Phễu chuyển đổi',team:'👨‍💼 Quản lý Team',
  embed:'🔌 Nhúng Widget',channels:'📡 FB & Zalo Setup',
  aiconfig:'🧠 AI Agent Config',leads:'🎯 Lead Scoring',
  billing:'💳 Billing & Gói',settings:'⚙️ Cài đặt'
};

async function go(id) {
  copilotPage = id; // theo dõi trang hiện tại cho Trợ lý AI
  if (typeof updateCopilotQuick === 'function') updateCopilotQuick();
  if (typeof maybeAutoOpenCopilot === 'function') maybeAutoOpenCopilot(id);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('on'));
  document.getElementById('page-'+id).classList.add('on');
  document.querySelectorAll('.nav-btn').forEach(n => {
    if (n.getAttribute('onclick') === `go('${id}')`) n.classList.add('on');
  });
  document.getElementById('pgTitle').textContent = pgTitles[id] || id;
  if (id==='dashboard')  { const s=await api('GET','/api/stats'); renderDash(s); }
  if (id==='customers')  { custs = await api('GET','/api/customers'); renderCust(); }
  if (id==='products')   { prods = await api('GET','/api/products'); renderProds(); }
  if (id==='autorules')  { rules = await api('GET','/api/rules'); renderRules(); }
  if (id==='botconfig')  { botCfg=await api('GET','/api/bot'); loadBotConfig(); }
  if (id==='embed')      { if(shopInfo) genEmbedCode(shopInfo.api_key, `${BASE}/widget/${shopInfo.api_key}/config.js`); }
  if (id==='channels')   { loadChannels(); }
  if (id==='orders')     { loadOrders(); }
  if (id==='billing')    { loadBilling(); }
  if (id==='settings')   { loadContactInfo(); }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
function renderDash(s) {
  document.getElementById('s0').textContent = s.total;
  document.getElementById('s1').textContent = s.closed;
  document.getElementById('s1r').textContent = 'Tỷ lệ ' + (s.total ? Math.round(s.closed/s.total*100) : 0) + '%';
  document.getElementById('s2').textContent = s.products;
  document.getElementById('s3').textContent = s.botReplies;
  document.getElementById('s0s').textContent = '+' + s.today + ' hôm nay';

  // Chart 7 ngày
  const labels = [], data7 = [];
  const today = new Date();
  for (let i=6; i>=0; i--) {
    const d = new Date(today); d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString('vi-VN',{month:'2-digit',day:'2-digit'}));
    const found = (s.weekly||[]).find(w => w.d && w.d.slice(0,10) === ds);
    data7.push(found ? +found.cnt : 0);
  }
  const ctx = document.getElementById('weekChart').getContext('2d');
  if (weekChart) weekChart.destroy();
  weekChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Khách mới',
        data: data7,
        backgroundColor: 'rgba(0,229,255,.25)',
        borderColor: '#00e5ff',
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color:'#6b6b9a', font:{size:10} }, grid: { color:'#1e1e35' } },
        y: { ticks: { color:'#6b6b9a', font:{size:10}, stepSize:1 }, grid: { color:'#1e1e35' }, beginAtZero:true }
      }
    }
  });

  // Channel stats
  const ch = s.channels || [];
  document.getElementById('channelStats').innerHTML = ch.length
    ? ch.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px">${{web:'🌐 Web',facebook:'📘 Facebook',zalo:'🟦 Zalo'}[c.channel]||c.channel}</span>
        <span style="font-family:var(--head);font-weight:700;color:var(--cyan)">${c.cnt}</span>
      </div>`).join('')
    : '<div class="empty" style="padding:16px">Chưa có tin nhắn</div>';

  // Recent customers
  const recent = custs.slice(0,5);
  document.getElementById('recentTb').innerHTML = recent.length
    ? recent.map(c=>`<tr>
        <td><div class="cell-name"><div class="av">${sanitizeHTML(c.name[0])}</div>${sanitizeHTML(c.name)}</div></td>
        <td style="font-family:monospace;font-size:11px;color:var(--muted)">${sanitizeHTML(c.phone||'–')}</td>
        <td><span class="tag ${c.status}">${statusLabel(c.status)}</span></td>
        <td style="color:var(--muted);font-size:11px">${fd(c.created_at)}</td>
      </tr>`).join('')
    : `<tr><td colspan="4" class="empty">Chưa có khách</td></tr>`;

  document.getElementById('actFeed').innerHTML = recent.length
    ? recent.map(c=>`<div class="act-item"><div class="act-dot" style="background:var(--green)"></div><div class="act-txt">Thêm khách: <strong>${sanitizeHTML(c.name)}</strong></div><div class="act-time">${fd(c.created_at)}</div></div>`).join('')
    : '<div class="empty">Chưa có hoạt động</div>';
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────
const CUST_PER_PAGE = 20;
let custPage = 1;
let selectedCusts = new Set();

function renderCust() {
  custPage = 1;
  renderCustPage();
}

function renderCustPage() {
  const search = (document.getElementById('custSearch')?.value||'').toLowerCase();
  const sf     = document.getElementById('fstatus')?.value||'';
  const list   = custs.filter(c =>
    (!search || c.name.toLowerCase().includes(search) || (c.phone||'').includes(search) || (c.email||'').toLowerCase().includes(search)) &&
    (!sf || c.status===sf)
  );
  const em = document.getElementById('custEmpty');
  if (!list.length) { document.getElementById('custTb').innerHTML=''; em.style.display='block'; document.getElementById('custPg').style.display='none'; return; }
  em.style.display='none';

  // Pagination
  const totalPages = Math.ceil(list.length / CUST_PER_PAGE);
  if (custPage > totalPages) custPage = totalPages;
  const start = (custPage - 1) * CUST_PER_PAGE;
  const page  = list.slice(start, start + CUST_PER_PAGE);

  document.getElementById('custTb').innerHTML = page.map(c=>`<tr>
    <td style="padding:10px 14px 10px 20px"><input type="checkbox" class="cust-chk" data-id="${c.id}" onchange="onCustChk()" ${selectedCusts.has(c.id)?'checked':''}></td>
    <td style="padding:10px 0"><div class="cell-name"><div class="av">${sanitizeHTML(c.name[0])}</div><div><div style="font-weight:600">${sanitizeHTML(c.name)}</div><div style="font-size:10px;color:var(--muted)">${sanitizeHTML(c.source||'')}</div></div></div></td>
    <td style="font-family:monospace;font-size:11px">${sanitizeHTML(c.phone||'–')}</td>
    <td style="font-size:11px;color:var(--muted)">${sanitizeHTML(c.email||'—')}</td>
    <td><span class="tag ${c.status}">${statusLabel(c.status)}</span></td>
    <td style="font-size:11px;color:var(--muted)">${fd(c.created_at)}</td>
    <td><div style="display:flex;gap:5px">
      <button class="btn btn-ghost"   style="padding:3px 9px;font-size:10px" onclick="openEdit(${c.id})">✏️</button>
      <button class="btn btn-purple"  style="padding:3px 9px;font-size:10px" onclick="openTimeline(${c.id},${JSON.stringify(c.name)})">📋</button>
      <button class="btn btn-amber"   style="padding:3px 9px;font-size:10px" onclick="setPortalPassword(${c.id},${JSON.stringify(c.name)})">🔑</button>
      <button class="btn btn-red"     style="padding:3px 9px;font-size:10px" onclick="delCust(${c.id})">🗑️</button>
    </div></td>
  </tr>`).join('');

  // Pagination controls
  const pgWrap = document.getElementById('custPg');
  pgWrap.style.display = totalPages > 1 ? 'flex' : 'none';
  document.getElementById('pgInfo').textContent = `Hiển thị ${start+1}–${Math.min(start+CUST_PER_PAGE, list.length)} / ${list.length} khách`;
  const btns = document.getElementById('pgBtns');
  btns.innerHTML = '';
  const addPgBtn = (label, page, disabled=false, active=false) => {
    const b = document.createElement('button');
    b.className = 'pg-btn' + (active?' on':'');
    b.textContent = label;
    b.disabled = disabled;
    if (!disabled) b.onclick = () => { custPage = page; renderCustPage(); };
    btns.appendChild(b);
  };
  addPgBtn('‹', custPage-1, custPage===1);
  for (let p=1; p<=totalPages; p++) {
    if (totalPages<=7 || Math.abs(p-custPage)<=1 || p===1 || p===totalPages) addPgBtn(p, p, false, p===custPage);
    else if (Math.abs(p-custPage)===2) { const sp=document.createElement('span'); sp.textContent='…'; sp.style.cssText='padding:4px 6px;color:var(--muted)'; btns.appendChild(sp); }
  }
  addPgBtn('›', custPage+1, custPage===totalPages);

  // Sync chkAll state
  const chkAll = document.getElementById('chkAll');
  if (chkAll) chkAll.checked = page.length > 0 && page.every(c => selectedCusts.has(c.id));
  updateBulkBar();
}

function onCustChk() {
  document.querySelectorAll('.cust-chk').forEach(cb => {
    const id = +cb.dataset.id;
    cb.checked ? selectedCusts.add(id) : selectedCusts.delete(id);
  });
  updateBulkBar();
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.cust-chk').forEach(cb => {
    const id = +cb.dataset.id;
    cb.checked = checked;
    checked ? selectedCusts.add(id) : selectedCusts.delete(id);
  });
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  const cnt = document.getElementById('bulkCount');
  if (selectedCusts.size > 0) {
    bar.classList.add('on');
    cnt.textContent = `${selectedCusts.size} đã chọn`;
  } else {
    bar.classList.remove('on');
  }
}

function clearBulk() {
  selectedCusts.clear();
  document.querySelectorAll('.cust-chk').forEach(cb => cb.checked = false);
  const chkAll = document.getElementById('chkAll');
  if (chkAll) chkAll.checked = false;
  updateBulkBar();
}

async function bulkChangeStatus() {
  const status = document.getElementById('bulkStatus').value;
  if (!status) { toast('Chọn trạng thái muốn đổi','err'); return; }
  if (!selectedCusts.size) return;
  if (!confirm(`Đổi ${selectedCusts.size} khách sang "${statusLabel(status)}"?`)) return;
  try {
    await Promise.all([...selectedCusts].map(id => {
      const c = custs.find(x=>x.id===id);
      if (!c) return;
      return api('PUT','/api/customers/'+id, {...c, status});
    }));
    toast(`✅ Đã đổi ${selectedCusts.size} khách sang ${statusLabel(status)}`);
    clearBulk();
    custs = await api('GET','/api/customers'); renderCust();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function bulkDelete() {
  if (!selectedCusts.size) return;
  if (!confirm(`Xóa ${selectedCusts.size} khách hàng đã chọn? Không thể hoàn tác!`)) return;
  try {
    await Promise.all([...selectedCusts].map(id => api('DELETE','/api/customers/'+id)));
    toast(`🗑️ Đã xóa ${selectedCusts.size} khách hàng`);
    clearBulk();
    custs = await api('GET','/api/customers'); renderCust();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function addCust(btn) {
  const name  = document.getElementById('fn').value.trim();
  const phone = document.getElementById('fph').value.trim();
  if (!name) { toast('Vui lòng nhập tên','err'); return; }
  await withLoading(btn || { innerHTML:'',disabled:false }, async () => {
    await api('POST','/api/customers',{
      name, phone, email:document.getElementById('fem').value,
      source:document.getElementById('fsrc').value, product:document.getElementById('fpr').value,
      status:document.getElementById('fst').value, note:document.getElementById('fno').value
    });
    toast('✅ Đã thêm: '+sanitizeHTML(name));
    clearCustForm();
    custs = await api('GET','/api/customers');
  });
}

function clearCustForm() {
  ['fn','fph','fem','fpr','fno'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('fst').value='new';
}

function openEdit(id) {
  const c = custs.find(x=>x.id===id); if (!c) return;
  document.getElementById('eid').value  = id;
  document.getElementById('en').value   = c.name;
  document.getElementById('ep').value   = c.phone||'';
  document.getElementById('ee').value   = c.email||'';
  document.getElementById('es').value   = c.status;
  document.getElementById('eno').value  = c.note||'';
  document.getElementById('editMod').classList.add('on');
}

async function saveEdit(btn) {
  const id = +document.getElementById('eid').value;
  await withLoading(btn || { innerHTML:'',disabled:false }, async () => {
    await api('PUT','/api/customers/'+id, {
      name:document.getElementById('en').value, phone:document.getElementById('ep').value,
      email:document.getElementById('ee').value, status:document.getElementById('es').value,
      note:document.getElementById('eno').value
    });
    closeMod(); toast('✅ Đã cập nhật');
    custs = await api('GET','/api/customers'); renderCust();
  });
}

async function delCust(id) {
  const c = custs.find(x=>x.id===id);
  if (!confirm(`Xóa khách hàng "${c?.name}"?`)) return;
  try {
    await api('DELETE','/api/customers/'+id);
    toast('🗑️ Đã xóa: '+(c?.name));
    custs = await api('GET','/api/customers'); renderCust();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
function closeMod() { document.getElementById('editMod').classList.remove('on'); }

// ── PRODUCTS ──────────────────────────────────────────────────────────
function renderProds() {
  const em = document.getElementById('prodEmpty');
  if (!prods.length) { document.getElementById('prodGrid').innerHTML=''; em.style.display='block'; return; }
  em.style.display='none';
  document.getElementById('prodGrid').innerHTML = prods.map(p=>`<div class="prod-card">
    ${p.badge?`<div class="prod-badge ${p.badge==='hot'?'pb-hot':'pb-new'}">${p.badge==='hot'?'🔥 Hot':'✨ New'}</div>`:''}
    ${p.image
      ? `<img src="${sanitizeHTML(p.image)}" alt="${sanitizeHTML(p.name)}" style="width:100%;height:130px;object-fit:cover;border-radius:10px;margin-bottom:8px"/>`
      : `<div class="prod-emoji">${sanitizeHTML(p.emoji||'📦')}</div>`}
    <div class="prod-name">${sanitizeHTML(p.name)}</div>
    <div class="prod-price">${sanitizeHTML(p.price||'0')}đ</div>
    <div style="font-size:11px;font-weight:600;margin:2px 0;color:${(+p.stock||0)<=0?'var(--red)':(+p.stock<=5?'var(--amber)':'var(--green)')}">📦 Kho: ${+p.stock||0}${(+p.stock||0)<=0?' (hết hàng)':''}</div>
    <div class="prod-desc">${sanitizeHTML(p.descr||'')}</div>
    <div class="prod-tags">${(p.tags||[]).map(t=>`<span class="ptag">${sanitizeHTML(t)}</span>`).join('')}</div>
    <div class="prod-actions">
      <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" onclick="openEditProd(${p.id})">✏️ Sửa</button>
      <button class="btn btn-red"   style="font-size:11px;padding:4px 10px" onclick="delProd(${p.id})">🗑️</button>
    </div>
  </div>`).join('');
}

function openAddProd() {
  document.getElementById('pid').value='';
  ['pname','pprice','pemoji','pdesc','ptags','pstock'].forEach(i=>document.getElementById(i).value='');
  document.getElementById('pbadge').value='';
  clearProdImage();
  document.getElementById('prodMod').classList.add('on');
}

function openEditProd(id) {
  const p = prods.find(x=>x.id===id); if (!p) return;
  document.getElementById('pid').value    = id;
  document.getElementById('pname').value  = p.name;
  document.getElementById('pprice').value = p.price;
  document.getElementById('pemoji').value = p.emoji||'';
  document.getElementById('pdesc').value  = p.descr||'';
  document.getElementById('ptags').value  = (p.tags||[]).join(', ');
  document.getElementById('pbadge').value = p.badge||'';
  document.getElementById('pstock').value = (p.stock!=null?p.stock:'');
  // ảnh sản phẩm
  document.getElementById('pimage').value = p.image || '';
  const prev = document.getElementById('pimgPreview');
  if (p.image) { prev.src = p.image; prev.style.display='block'; } else { prev.src=''; prev.style.display='none'; }
  document.getElementById('pimgFile').value='';
  document.getElementById('prodMod').classList.add('on');
}

// Cờ báo ảnh đang upload — chặn việc bấm "Lưu" khi ảnh chưa tải xong (tránh mất ảnh)
let prodUploading = false;
// Tải ảnh sản phẩm từ máy → upload → lấy URL
async function uploadProdImage(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { toast('Ảnh quá lớn (tối đa 5MB)','err'); input.value=''; return; }
  const hint = document.getElementById('pimgHint');
  hint.textContent = '⏳ Đang tải ảnh...';
  prodUploading = true;
  try {
    const dataUrl = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
    const r = await api('POST','/api/upload-image',{ data: dataUrl });
    document.getElementById('pimage').value = r.url;
    const prev = document.getElementById('pimgPreview');
    prev.src = r.url; prev.style.display='block';
    hint.textContent = '✅ Đã tải ảnh.';
  } catch(e) { hint.textContent = '❌ '+e.message; toast('❌ '+e.message,'err'); }
  finally { prodUploading = false; }
}
function clearProdImage() {
  document.getElementById('pimage').value='';
  const prev=document.getElementById('pimgPreview'); if(prev){ prev.src=''; prev.style.display='none'; }
  const f=document.getElementById('pimgFile'); if(f) f.value='';
  const h=document.getElementById('pimgHint'); if(h) h.textContent='Chọn ảnh từ máy (tối đa 5MB). Không có ảnh sẽ dùng emoji.';
}

async function saveProd() {
  const id    = document.getElementById('pid').value;
  const obj   = {
    name:   document.getElementById('pname').value,
    price:  document.getElementById('pprice').value,
    emoji:  document.getElementById('pemoji').value||'📦',
    descr:  document.getElementById('pdesc').value,
    tags:   document.getElementById('ptags').value.split(',').map(t=>t.trim()).filter(Boolean),
    badge:  document.getElementById('pbadge').value,
    image:  document.getElementById('pimage').value || null,
    stock:  parseInt(document.getElementById('pstock').value,10)||0
  };
  if (!obj.name || !obj.price) { toast('Tên và giá không được trống','err'); return; }
  if (prodUploading) { toast('⏳ Ảnh đang tải lên, đợi thấy "✅ Đã tải ảnh" rồi bấm Lưu nhé','err'); return; }
  try {
    if (id) await api('PUT','/api/products/'+id, obj);
    else    await api('POST','/api/products', obj);
    toast(id ? '✅ Đã cập nhật sản phẩm' : '✅ Đã thêm sản phẩm');
    closeProdMod();
    prods = await api('GET','/api/products');
    renderProds();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function delProd(id) {
  if (!confirm('Xóa sản phẩm?')) return;
  try {
    await api('DELETE','/api/products/'+id);
    toast('🗑️ Đã xóa');
    prods = await api('GET','/api/products'); renderProds();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
function closeProdMod() { document.getElementById('prodMod').classList.remove('on'); }

// ── RULES ─────────────────────────────────────────────────────────────
function renderRules() {
  document.getElementById('rulesList').innerHTML = rules.map(r=>`<div class="rule-row">
    <span class="rule-kw">"${r.keyword}"</span>
    <span class="rule-arr">→</span>
    <span class="rule-reply">${r.reply.slice(0,55)}${r.reply.length>55?'...':''}</span>
    <span class="rule-cnt">${r.hits||0}×</span>
    <input type="checkbox" class="toggle" ${r.active?'checked':''} onchange="toggleRule(${r.id},this.checked)"/>
    <button class="btn btn-red" style="padding:3px 9px;font-size:10px" onclick="delRule(${r.id})">🗑️</button>
  </div>`).join('');
  const tot = rules.reduce((a,r)=>a+(+r.hits||0),0);
  document.getElementById('ruleStats').innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
    <div><div style="font-family:var(--head);font-size:24px;font-weight:800">${rules.length}</div><div style="font-size:11px;color:var(--muted)">Quy tắc</div></div>
    <div><div style="font-family:var(--head);font-size:24px;font-weight:800">${tot}</div><div style="font-size:11px;color:var(--muted)">Tổng kích hoạt</div></div>
    <div><div style="font-family:var(--head);font-size:24px;font-weight:800">${rules.filter(r=>r.active).length}</div><div style="font-size:11px;color:var(--muted)">Đang bật</div></div>
  </div>`;
}

async function addRule() {
  const k = document.getElementById('nkw').value.trim();
  const r = document.getElementById('nrep').value.trim();
  if (!k||!r) { toast('Nhập đủ từ khóa và trả lời','err'); return; }
  try {
    await api('POST','/api/rules',{keyword:k,reply:r});
    document.getElementById('nkw').value='';
    document.getElementById('nrep').value='';
    toast('✅ Đã thêm quy tắc');
    rules = await api('GET','/api/rules'); renderRules();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function toggleRule(id, active) {
  const r = rules.find(x=>x.id===id); if (!r) return;
  try {
    await api('PUT','/api/rules/'+id,{keyword:r.keyword,reply:r.reply,active});
    rules = await api('GET','/api/rules'); renderRules();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function delRule(id) {
  if (!confirm('Xóa rule?')) return;
  try {
    await api('DELETE','/api/rules/'+id);
    toast('🗑️ Đã xóa');
    rules = await api('GET','/api/rules'); renderRules();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── ĐƠN HÀNG (POS) ─────────────────────────────────────────────────────
let orders = [], orderItems = [], orderCustomerId = null;
// Tạo đơn ngay từ Hộp thư (chat) — tự điền thông tin khách
function orderFromInbox(cid, name, phone) {
  openOrderModal({ customer_id: cid || null, name: name || '', phone: phone || '' });
}

// ── GỬI TIN HÀNG LOẠT ──────────────────────────────────────────────────
async function openBroadcast() {
  document.getElementById('bcText').value = '';
  document.getElementById('bcAudience').textContent = 'Đang đếm người nhận...';
  document.getElementById('bcMod').classList.add('on');
  try {
    const a = await api('GET','/api/broadcast/audience');
    const by = (a.byChannel||[]).map(c=>`${c.channel}: ${c.n}`).join(' · ');
    document.getElementById('bcAudience').innerHTML = `Sẽ gửi tới <strong>${a.total}</strong> khách${by?` (${by})`:''}.`;
  } catch(e) { document.getElementById('bcAudience').textContent = 'Không đếm được người nhận.'; }
}
function closeBroadcast(){ document.getElementById('bcMod').classList.remove('on'); }
async function sendBroadcast() {
  const text = document.getElementById('bcText').value.trim();
  if (!text) { toast('Nhập nội dung tin','err'); return; }
  if (!confirm('Gửi tin này tới TẤT CẢ khách đã từng nhắn?')) return;
  try {
    const r = await api('POST','/api/broadcast',{ text });
    toast(`✅ Đã gửi ${r.sent} tin (đẩy thật ${r.pushed} qua kênh có token)`);
    closeBroadcast();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
const ORDER_STATUS = {
  new:       { label:'🆕 Mới',     color:'var(--cyan)' },
  confirmed: { label:'✅ Đã xác nhận', color:'var(--green)' },
  shipping:  { label:'🚚 Đang giao', color:'var(--amber)' },
  done:      { label:'🎉 Hoàn tất', color:'var(--purple)' },
  cancelled: { label:'✕ Đã huỷ',  color:'var(--red)' },
};
function priceNum(v){ const n=parseInt(String(v==null?'':v).replace(/[^\d]/g,''),10); return isNaN(n)?0:n; }

async function loadOrders() {
  try {
    orders = await api('GET','/api/orders');
    renderOrders();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
function renderOrders() {
  // thống kê nhanh
  const sum = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(+o.total||0),0);
  const pending = orders.filter(o=>o.status==='new'||o.status==='confirmed'||o.status==='shipping').length;
  const st = document.getElementById('orderStats');
  if (st) st.innerHTML = [
    {l:'Tổng đơn', v:orders.length, i:'🧾'},
    {l:'Đang xử lý', v:pending, i:'⏳'},
    {l:'Doanh thu', v:fmoney(sum), i:'💰'},
  ].map(s=>`<div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:8px 14px"><div style="font-size:10px;color:var(--muted)">${s.i} ${s.l}</div><div style="font-size:18px;font-weight:800;color:var(--cyan)">${s.v}</div></div>`).join('');

  const tb = document.getElementById('ordersTb');
  if (!tb) return;
  tb.innerHTML = orders.length ? orders.map(o=>{
    const itemsTxt = (o.items||[]).map(it=>`${sanitizeHTML(it.name)}×${it.qty}`).join(', ');
    const optStatus = Object.entries(ORDER_STATUS).map(([k,v])=>`<option value="${k}" ${o.status===k?'selected':''}>${v.label}</option>`).join('');
    return `<tr>
      <td style="padding:10px 20px;font-weight:700">#${o.id}</td>
      <td style="font-size:12px">${sanitizeHTML(o.customer_name||'Khách lẻ')}<div style="font-size:10px;color:var(--muted)">${sanitizeHTML(o.phone||'')}</div></td>
      <td style="font-size:12px;max-width:240px">${itemsTxt||'—'}</td>
      <td style="font-weight:700">${fmoney(o.total)}</td>
      <td><select onchange="changeOrderStatus(${o.id},this.value)" style="font-size:11px;padding:3px 6px;color:${ORDER_STATUS[o.status]?.color||'var(--text)'}">${optStatus}</select></td>
      <td style="font-size:11px;color:var(--muted)">${fd(o.created_at)}</td>
      <td><button class="btn btn-red" style="padding:3px 9px;font-size:10px" onclick="delOrder(${o.id})">🗑️</button></td>
    </tr>`;
  }).join('') : '<tr><td colspan="7" class="empty" style="padding:20px">Chưa có đơn nào — bấm "🛒 Tạo đơn mới"</td></tr>';
}

async function openOrderModal(prefill) {
  orderItems = []; orderCustomerId = null;
  if (!prods || !prods.length) { try { prods = await api('GET','/api/products'); } catch(e){} }
  // đổ danh sách sản phẩm vào select
  const sel = document.getElementById('oProd');
  sel.innerHTML = (prods||[]).map(p=>`<option value="${p.id}">${sanitizeHTML(p.name)} — ${sanitizeHTML(p.price||'0')}đ (kho ${+p.stock||0})</option>`).join('') || '<option value="">(chưa có sản phẩm)</option>';
  // prefill khách (từ Hộp thư / CRM)
  document.getElementById('oName').value  = prefill?.name  || '';
  document.getElementById('oPhone').value = prefill?.phone || '';
  document.getElementById('oAddr').value  = '';
  document.getElementById('oNote').value  = '';
  orderCustomerId = prefill?.customer_id || null;
  renderOrderItems();
  document.getElementById('orderMod').classList.add('on');
}
function closeOrderMod(){ document.getElementById('orderMod').classList.remove('on'); }
function addOrderItem() {
  const pid = +document.getElementById('oProd').value;
  const qty = Math.max(1, parseInt(document.getElementById('oQty').value,10)||1);
  const p = (prods||[]).find(x=>x.id===pid);
  if (!p) { toast('Chọn sản phẩm','err'); return; }
  const existing = orderItems.find(i=>i.product_id===pid);
  if (existing) existing.qty += qty;
  else orderItems.push({ product_id:p.id, name:p.name, price:p.price, qty });
  document.getElementById('oQty').value = 1;
  renderOrderItems();
}
function removeOrderItem(i){ orderItems.splice(i,1); renderOrderItems(); }
function renderOrderItems() {
  const el = document.getElementById('oItems');
  let total = 0;
  el.innerHTML = orderItems.length ? orderItems.map((it,i)=>{
    const line = priceNum(it.price)*it.qty; total += line;
    return `<div style="display:flex;align-items:center;gap:8px;font-size:13px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span style="flex:1">${sanitizeHTML(it.name)} <span style="color:var(--muted)">×${it.qty}</span></span>
      <span style="font-weight:700">${fmoney(line)}</span>
      <span style="cursor:pointer;color:var(--red)" onclick="removeOrderItem(${i})">✕</span>
    </div>`;
  }).join('') : '<div style="font-size:12px;color:var(--muted);padding:6px 0">Chưa có sản phẩm — chọn ở trên rồi bấm "+ Thêm".</div>';
  document.getElementById('oTotal').textContent = fmoney(total);
}
async function saveOrder() {
  if (!orderItems.length) { toast('Đơn chưa có sản phẩm','err'); return; }
  const body = {
    customer_id: orderCustomerId,
    customer_name: document.getElementById('oName').value.trim(),
    phone: document.getElementById('oPhone').value.trim(),
    address: document.getElementById('oAddr').value.trim(),
    note: document.getElementById('oNote').value.trim(),
    items: orderItems,
  };
  try {
    const r = await api('POST','/api/orders', body);
    toast(`✅ Đã tạo đơn #${r.id} — ${fmoney(r.total)} (đã trừ kho)`);
    closeOrderMod();
    if (document.getElementById('page-orders').classList.contains('on')) loadOrders();
    prods = await api('GET','/api/products'); // cập nhật kho
    if (document.getElementById('page-products').classList.contains('on')) renderProds();
  } catch(e) { toast('❌ '+e.message,'err'); }
}
async function changeOrderStatus(id, status) {
  try {
    await api('PUT','/api/orders/'+id+'/status',{ status });
    toast('✅ Đã cập nhật trạng thái' + (status==='cancelled'?' (đã hoàn kho)':''));
    loadOrders();
  } catch(e) { toast('❌ '+e.message,'err'); loadOrders(); }
}
async function delOrder(id) {
  if (!confirm('Xoá đơn #'+id+'?')) return;
  try { await api('DELETE','/api/orders/'+id); toast('🗑️ Đã xoá đơn'); loadOrders(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

// ── BOT CONFIG ────────────────────────────────────────────────────────
function loadBotConfig() {
  if (!botCfg) return;
  document.getElementById('botname').value    = botCfg.name||'';
  document.getElementById('botcolor').value   = botCfg.color||'#7c3aed';
  document.getElementById('botavatar').value  = botCfg.avatar||'🤖';
  document.getElementById('botwelcome').value = botCfg.welcome||'';
  quickBtns = botCfg.quick_btns || [];
  document.getElementById('bsRules').textContent = rules.length;
  document.getElementById('bsProds').textContent = prods.length;
  document.getElementById('bsAuto').textContent  = rules.reduce((a,r)=>a+(+r.hits||0),0);
  renderQuickBtns();
  initBotPreview();
}

async function saveBotConfig() {
  try {
    await api('PUT','/api/bot',{
      name:     document.getElementById('botname').value,
      color:    document.getElementById('botcolor').value,
      avatar:   document.getElementById('botavatar').value,
      welcome:  document.getElementById('botwelcome').value,
      quick_btns: quickBtns
    });
    toast('✅ Đã lưu cấu hình bot');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function initBotPreview() {
  botMsgs = [];
  const w = document.getElementById('botwelcome')?.value || botCfg.welcome || '';
  addBotMsg('bot', w);
  renderBotMsgs(); renderQuickBtns(); updateBotPreview();
}

function addBotMsg(from, text) { botMsgs.push({from,text,ts:Date.now()}); }

function renderBotMsgs() {
  const av  = document.getElementById('botavatar')?.value||'🤖';
  const el  = document.getElementById('phoneMsgs');
  el.innerHTML = botMsgs.map(m=>`<div class="bm ${m.from==='user'?'user':''}">
    ${m.from!=='user'?`<div class="bm-av">${av}</div>`:''}
    <div><div class="bm-bubble">${m.text}</div><div class="bm-time">${ft(m.ts)}</div></div>
  </div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function botAutoReply(text) {
  const t = text.toLowerCase();
  for (const r of rules) {
    if (r.active && r.keyword.split('|').some(k=>k.trim()&&t.includes(k.trim().toLowerCase()))) {
      let rep = r.reply;
      if (prods.length) {
        const p = prods[0];
        rep = rep.replace(/{tên_sp}/g,p.name||'').replace(/{giá_sp}/g,p.price||'');
        if (rep.includes('{product_list}'))
          rep = rep.replace(/{product_list}/g, '\n'+prods.slice(0,5).map(x=>`${x.emoji||'📦'} ${x.name} – ${x.price}đ`).join('\n'));
      }
      return rep;
    }
  }
  const fb=['Cảm ơn bạn! Hỏi mình về giá, sản phẩm, ship nhé 💬','Shop đang hoạt động! Bạn cần tư vấn gì? 😊'];
  return fb[Math.floor(Math.random()*fb.length)];
}

function botSend() {
  const inp  = document.getElementById('phoneInput');
  const text = inp.value.trim(); if (!text) return;
  inp.value  = '';
  addBotMsg('user', text); renderBotMsgs();
  setTimeout(() => { addBotMsg('bot', botAutoReply(text)); renderBotMsgs(); }, 650);
}

function updateBotPreview() {
  const name  = document.getElementById('botname')?.value||'Bot';
  const color = document.getElementById('botcolor')?.value||'#7c3aed';
  const av    = document.getElementById('botavatar')?.value||'🤖';
  document.getElementById('phoneName').textContent = name;
  document.getElementById('phoneAv').textContent   = av;
  document.getElementById('phoneHd').style.background = color;
  if (document.getElementById('prevBotName')) document.getElementById('prevBotName').textContent = name;
  if (document.getElementById('prevBtn'))     document.getElementById('prevBtn').style.background = color;
}

function renderQuickBtns() {
  const el = document.getElementById('quickBtnList');
  if (el) el.innerHTML = quickBtns.map((b,i)=>`<div style="display:flex;align-items:center;gap:4px;background:var(--s3);border:1px solid var(--border);border-radius:8px;padding:4px 10px;font-size:12px">${b}<span style="cursor:pointer;color:var(--red);margin-left:4px" onclick="removeQBtn(${i})">×</span></div>`).join('');
  const pq = document.getElementById('phoneQBtns');
  if (pq)  pq.innerHTML = quickBtns.map(b=>`<div class="qb" onclick="tapQBtn('${b.replace(/'/g,"\\'")}'">${b}</div>`).join('');
}

function addQuickBtn()    { const v=document.getElementById('newQBtn').value.trim(); if(!v)return; quickBtns.push(v); document.getElementById('newQBtn').value=''; renderQuickBtns(); }
function removeQBtn(i)    { quickBtns.splice(i,1); renderQuickBtns(); }
function tapQBtn(text)    { document.getElementById('phoneInput').value=text; botSend(); }

// ── EMBED ─────────────────────────────────────────────────────────────
function genEmbedCode(apiKey, configUrl) {
  const key = apiKey || shopInfo?.api_key;
  const url = configUrl || (shopInfo ? `${BASE}/widget/${shopInfo.api_key}/config.js` : '');
  const code = `<!-- SalesKit Widget — kết nối backend PostgreSQL -->
<script src="${url}"><\/script>
<script src="${BASE}/widget-connected.js" data-apikey="${key}"><\/script>
<!-- End SalesKit Widget -->`;
  const el = document.getElementById('embedPre');
  if (el) el.textContent = code;
}

function copyEmbed() { navigator.clipboard.writeText(document.getElementById('embedPre').textContent); toast('✅ Đã copy code nhúng','inf'); }
function copyField(id) { navigator.clipboard.writeText(document.getElementById(id).value); toast('✅ Đã copy','inf'); }
function copyText(text) { navigator.clipboard.writeText(text || ''); toast('✅ Đã copy','inf'); }

function downloadWidgetConnected() {
  const url = document.getElementById('fbWebhook')?.value || '';
  const apiKey = shopInfo?.api_key || '';
  const js = `// SalesKit Widget — kết nối backend PostgreSQL
(function(){
  var API_KEY = '${apiKey}';
  var BASE    = '${BASE}';
  var CFG = {};
  function loadConfig(cb){
    var s=document.createElement('script');
    s.src=BASE+'/widget/'+API_KEY+'/config.js';
    s.onload=function(){ CFG=window.SALESKIT_CONFIG||{}; cb(); };
    document.head.appendChild(s);
  }
  function sendMsg(text,cb){
    fetch(BASE+'/widget/'+API_KEY+'/reply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,channel:'web'})}).then(r=>r.json()).then(d=>cb(d.reply)).catch(()=>cb('Xin lỗi, có lỗi xảy ra.'));
  }
  // UI tương tự standalone widget nhưng gọi backend
  loadConfig(function(){
    var MSGS=[],OPEN=false;
    var isDark=CFG.theme!=='light';
    var wrap=document.createElement('div');
    var bg=isDark?'#0d0d1a':'#fff'; var bgB=isDark?'#1e1e35':'#f0f0f5'; var tc=isDark?'#e8e8f0':'#111';
    wrap.innerHTML='<div id="sk-btn" style="position:fixed;bottom:20px;'+(CFG.position||'right')+':20px;z-index:99999;width:54px;height:54px;border-radius:50%;background:'+(CFG.color||'#7c3aed')+';display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.3)" onclick="SK.toggle()">💬</div><div id="sk-box" style="position:fixed;bottom:84px;'+(CFG.position||'right')+':20px;z-index:99998;width:320px;height:460px;border-radius:16px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.4)"><div style="padding:14px;background:'+(CFG.color||'#7c3aed')+';display:flex;align-items:center;gap:10px"><div style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:16px">'+(CFG.avatar||'🤖')+'</div><div><div style="font-weight:700;font-size:14px;color:#fff">'+(CFG.name||'Bot')+'</div><div style="font-size:11px;color:rgba(255,255,255,.7)">Đang hoạt động</div></div><div onclick="SK.toggle()" style="margin-left:auto;cursor:pointer;color:#fff;font-size:20px">×</div></div><div id="sk-msgs" style="flex:1;overflow-y:auto;padding:14px;background:'+bg+';display:flex;flex-direction:column;gap:10px"></div><div style="padding:10px;background:'+bg+';display:flex;gap:8px"><input id="sk-inp" placeholder="Nhập tin nhắn..." onkeydown="if(event.key===\'Enter\')SK.send()" style="flex:1;background:'+bgB+';border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:8px 14px;font-size:12.5px;color:'+tc+';outline:none"/><button onclick="SK.send()" style="background:'+(CFG.color||'#7c3aed')+';border:none;border-radius:50%;width:34px;height:34px;color:#fff;cursor:pointer">➤</button></div></div>';
    document.body.appendChild(wrap);
    function render(){var el=document.getElementById('sk-msgs');if(!el)return;el.innerHTML=MSGS.map(function(m){var u=m.from==='user';return'<div style="display:flex;gap:7px;'+(u?'flex-direction:row-reverse;align-self:flex-end':'')+'">'+(u?'':'<div style="width:24px;height:24px;border-radius:50%;background:'+(CFG.color||'#7c3aed')+';display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">'+(CFG.avatar||'🤖')+'</div>')+'<div style="padding:8px 12px;border-radius:12px;font-size:12.5px;background:'+(u?CFG.color:'#1e1e35')+';color:#fff;max-width:80%">'+m.text+'</div></div>';}).join('');el.scrollTop=el.scrollHeight;}
    window.SK={
      toggle:function(){OPEN=!OPEN;var b=document.getElementById('sk-box');if(b)b.style.display=OPEN?'flex':'none';if(OPEN&&MSGS.length===0){MSGS.push({from:'bot',text:CFG.welcome||'Xin chào!'});render();}},
      send:function(){var inp=document.getElementById('sk-inp');var text=inp.value.trim();if(!text)return;inp.value='';MSGS.push({from:'user',text});render();sendMsg(text,function(reply){MSGS.push({from:'bot',text:reply});render();});}
    };
  });
})();`;
  const b=new Blob([js],{type:'application/javascript'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='saleskit-widget-connected.js'; a.click();
  toast('📥 Đã tải widget kết nối backend');
}

// ── CHANNELS ──────────────────────────────────────────────────────────
function setChStatus(id, connected) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'channel-status ' + (connected ? 'cs-active' : 'cs-inactive');
  el.textContent = connected ? t('ch.connected') : t('ch.not_connected');
}

async function loadChannels() {
  try {
    const data = await api('GET','/api/channels');
    const fb = data.facebook||{}, zl = data.zalo||{},
          tg = data.telegram||{}, wa = data.whatsapp||{};
    if (fb.page_token)   document.getElementById('fbToken').value   = fb.page_token;
    if (fb.verify_token) document.getElementById('fbVerify').value  = fb.verify_token;
    document.getElementById('fbAutoComment').checked = !!fb.auto_comment;
    if (zl.page_token)   document.getElementById('zaloToken').value = zl.page_token;
    if (zl.verify_token) document.getElementById('zaloSecret').value= zl.verify_token;
    if (tg.page_token)   document.getElementById('tgToken').value   = tg.page_token;
    if (wa.page_token)   document.getElementById('waToken').value   = wa.page_token;
    if (wa.verify_token) document.getElementById('waVerify').value  = wa.verify_token;
    setChStatus('fbStatus',   !!fb.page_token);
    setChStatus('zaloStatus', !!zl.page_token);
    setChStatus('tgStatus',   !!tg.page_token);
    setChStatus('waStatus',   !!wa.page_token);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function saveFB() {
  const page_token   = document.getElementById('fbToken').value.trim();
  const verify_token = document.getElementById('fbVerify').value.trim();
  const auto_comment = document.getElementById('fbAutoComment').checked;
  if (!page_token || !verify_token) { toast('Điền Page Token và Verify Token','err'); return; }
  try { await api('PUT','/api/channels/facebook',{page_token,verify_token,auto_comment}); toast('✅ Đã lưu cấu hình Facebook'); loadChannels(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

async function saveZalo() {
  const page_token   = document.getElementById('zaloToken').value.trim();
  const verify_token = document.getElementById('zaloSecret').value.trim();
  if (!page_token) { toast('Fill OA Access Token','err'); return; }
  try { await api('PUT','/api/channels/zalo',{page_token,verify_token}); toast('✅ Zalo config saved'); loadChannels(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

async function saveTelegram() {
  const page_token = document.getElementById('tgToken').value.trim();
  if (!page_token) { toast('Fill Bot Token','err'); return; }
  try { await api('PUT','/api/channels/telegram',{page_token,verify_token:''}); toast('✅ Telegram config saved'); loadChannels(); }
  catch(e) { toast('❌ '+e.message,'err'); }
}

async function registerTelegramWebhook() {
  const botToken = document.getElementById('tgToken').value.trim();
  if (!botToken) { toast('Save Bot Token first','err'); return; }
  const apiKey = shopInfo?.api_key;
  if (!apiKey) { toast('Login first','err'); return; }
  const webhookUrl = `${BASE}/webhook/${apiKey}/telegram`;
  try {
    const { default: fetch } = window;
    const r = await window.fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ url: webhookUrl })
    });
    const d = await r.json();
    if (d.ok) toast('✅ Telegram webhook registered!');
    else toast('❌ Telegram: ' + d.description, 'err');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function saveWhatsApp() {
  const page_token   = document.getElementById('waToken').value.trim();
  const verify_token = document.getElementById('waVerify').value.trim();
  const phone_id     = document.getElementById('waPhoneId')?.value.trim()||'';
  if (!page_token || !verify_token) { toast('Fill Access Token and Verify Token','err'); return; }
  try {
    await api('PUT','/api/channels/whatsapp',{ page_token: page_token+'|'+phone_id, verify_token });
    toast('✅ WhatsApp config saved'); loadChannels();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function testReply() {
  const ch  = document.getElementById('testChannel').value;
  const msg = document.getElementById('testMsg').value.trim();
  if (!msg) { toast('Nhập tin nhắn test','err'); return; }
  try {
    const apiKey = shopInfo?.api_key;
    const r = await fetch(`${BASE}/widget/${apiKey}/reply`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text:msg, channel:ch})
    });
    const data = await r.json();
    const el = document.getElementById('testResult');
    el.style.display='block';
    el.innerHTML = `<div style="color:var(--muted);font-size:11px;margin-bottom:6px">Kênh: ${ch} · Tin: "${msg}"</div>
      <div style="color:var(--green);font-size:13px">🤖 Bot: ${data.reply||'(không có phản hồi)'}</div>`;
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── BILLING ───────────────────────────────────────────────────────────
const PLAN_LABELS = {
  free:       { name:'Free',       color:'var(--muted)',  price:'Miễn phí',    per:'',        limits:'100 KH · 10 SP · 5 rules', icon:'🌱', usd:0 },
  basic:      { name:'Basic',      color:'var(--green)',  price:'299.000đ',    per:'/tháng',  limits:'500 KH · 50 SP · 30 rules', icon:'🚀', usd:12 },
  pro:        { name:'Pro',        color:'var(--cyan)',   price:'699.000đ',    per:'/tháng',  limits:'5.000 KH · 200 SP · 100 rules · FB+Zalo', icon:'⚡', popular:true, usd:28 },
  enterprise: { name:'Enterprise', color:'var(--purple)', price:'1.999.000đ', per:'/tháng',  limits:'Không giới hạn · Hỗ trợ 24/7 · Custom', icon:'💎', usd:80 },
};

// Phương thức thanh toán quốc tế do chủ app cấu hình (nạp trong loadBilling)
let platformPays = {};
// Gói động (giá/hạn mức/giảm giá) từ chủ app — nạp trong loadBilling
let dbPlans = {};

// ── QR PAYMENT STATE ──────────────────────────────────────────────────
let qrTimerInterval = null;
let qrPollInterval  = null;
let currentOrderRef = null;

async function loadBilling() {
  loadPlatformPayments();
  try {
    const data = await api('GET','/api/billing');
    const current = data.current_plan || 'free';
    platformPays = await fetch(`${BASE}/api/platform-payments`, { headers:{'ngrok-skip-browser-warning':'true'} }).then(r=>r.json()).catch(()=>({}));
    dbPlans = await fetch(`${BASE}/api/billing/plans`, { headers:{'ngrok-skip-browser-warning':'true'} }).then(r=>r.json()).catch(()=>({}));
    const intlOn = !!(platformPays.stripe || platformPays.paypal || platformPays.wise || platformPays.visa);
    const limFmt = v => v === -1 ? '∞' : v;

    // Plan cards (giá / hạn mức / giảm giá lấy động từ chủ app)
    document.getElementById('planGrid').innerHTML = Object.entries(PLAN_LABELS).map(([key, p]) => {
      const dp = dbPlans[key] || {};
      const isFree = key === 'free';
      const disc = +dp.discount_pct || 0;
      const usd  = dp.price_usd_final != null ? dp.price_usd_final : (p.usd || '');
      let priceHtml;
      if (isFree) priceHtml = `<div class="plan-price">Miễn phí</div>`;
      else if (disc > 0) priceHtml =
        `<div style="font-size:14px;color:var(--muted);text-decoration:line-through;line-height:1">${fmoney(dp.price)}</div>
         <div class="plan-price">${fmoney(dp.price_final)}</div>
         <div style="font-size:11px;color:var(--green);font-weight:700">🔻 Giảm ${disc}% · $${usd}</div>`;
      else priceHtml = `<div class="plan-price">${fmoney(dp.price)}</div>`;
      const limits = (dp.customers == null) ? p.limits
        : `${limFmt(dp.customers)} KH · ${limFmt(dp.products)} SP · ${limFmt(dp.rules)} rules`;
      return `<div class="plan-card ${key===current?'active':''} ${p.popular?'popular':''}">
        ${p.popular ? '<div class="plan-badge">⭐ PHỔ BIẾN</div>' : ''}
        <div style="font-size:28px;margin-bottom:8px">${p.icon}</div>
        <div class="plan-name">${p.name}</div>
        ${priceHtml}
        <div class="plan-per">${isFree?'':p.per}</div>
        <ul class="plan-feat">${limits.split('·').map(f=>`<li>${f.trim()}</li>`).join('')}</ul>
        ${key===current
          ? '<div style="margin-top:12px;font-size:11px;font-weight:700;color:var(--green)">✓ Gói hiện tại</div>'
          : key==='free' ? ''
          : `<div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">
               <button class="btn btn-cyan" style="width:100%;justify-content:center;font-size:12px"
                 onclick="upgradePlan('${key}')" data-i18n="pay.qr">${t('pay.qr')}</button>
               ${data.stripe_enabled ? `
               <button class="btn btn-purple" style="width:100%;justify-content:center;font-size:12px"
                 onclick="upgradeWithStripe('${key}')" data-i18n="pay.stripe">${t('pay.stripe')}</button>` : ''}
               ${intlOn ? `
               <button class="btn btn-ghost" style="width:100%;justify-content:center;font-size:12px;border-color:var(--cyan)"
                 onclick="payInternational('${key}')">🌐 Pay International ($${usd})</button>` : ''}
             </div>`}
      </div>`;
    }).join('');

    // Current plan info + usage bars
    const pi = data.plan_info || {};
    const ab = data.active_bill;
    const usage = data.usage || {};
    function usageBar(used, limit, label, icon) {
      if (limit === -1) return `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;color:var(--muted)">${icon} ${label}</span><span style="font-size:12px;color:var(--text)">${used} / ∞</span></div>`;
      const pct  = limit > 0 ? Math.min(100, Math.round(used/limit*100)) : 0;
      const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)';
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;color:var(--muted)">${icon} ${label}</span>
          <span style="font-size:11px;font-weight:700;color:${color}">${used}/${limit} (${pct}%)</span>
        </div>
        <div style="height:5px;background:var(--border);border-radius:3px">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width .4s"></div>
        </div>
      </div>`;
    }
    document.getElementById('currentPlanInfo').innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;margin-bottom:14px">
        <div style="font-size:32px">${PLAN_LABELS[current]?.icon||'🌱'}</div>
        <div>
          <div style="font-family:var(--head);font-size:18px;font-weight:800;color:${PLAN_LABELS[current]?.color||'var(--text)'}">${PLAN_LABELS[current]?.name||current}</div>
          ${ab ? `<div style="font-size:11px;color:var(--amber)">📅 Hết hạn: ${new Date(ab.expires_at).toLocaleDateString('vi-VN')}</div>` : '<div style="font-size:11px;color:var(--muted)">Gói miễn phí</div>'}
        </div>
      </div>
      <div style="padding:0 4px">
        ${usageBar(usage.customers||0, pi.customers, 'Khách hàng', '👥')}
        ${usageBar(usage.products||0,  pi.products,  'Sản phẩm',   '📦')}
        ${usageBar(usage.rules||0,     pi.rules,     'Auto-reply rules', '⚡')}
      </div>
    `;

    // Orders table
    const orders = data.orders || [];
    const statusMap = {
      pending:   '<span class="bill-status bs-pending">⏳ Chờ TT</span>',
      active:    '<span class="bill-status bs-active">✅ Đã TT</span>',
      cancelled: '<span class="bill-status bs-cancelled">✕ Đã hủy</span>',
      expired:   '<span class="bill-status bs-expired">⌛ Hết hạn</span>',
    };
    document.getElementById('billingOrdersTb').innerHTML = orders.length
      ? orders.map(o => `<tr>
          <td style="padding:10px 20px;font-family:monospace;font-size:11px;color:var(--cyan)">${o.payment_ref}</td>
          <td>${PLAN_LABELS[o.plan]?.icon||''} ${PLAN_LABELS[o.plan]?.name||o.plan}</td>
          <td style="font-weight:700">${fmoney(o.amount)}</td>
          <td>${statusMap[o.status]||o.status}</td>
          <td style="font-size:11px;color:var(--muted)">${fd(o.created_at)}</td>
          <td style="font-size:11px;color:var(--muted)">${o.paid_at ? fd(o.paid_at) : '—'}</td>
          <td><div style="display:flex;gap:4px">
            ${o.status==='pending' ? `
              <button class="btn btn-ghost" style="padding:3px 9px;font-size:10px" onclick="showQRAgain('${o.payment_ref}')">🔲 QR</button>
              <button class="btn btn-red" style="padding:3px 9px;font-size:10px" onclick="cancelOrder('${o.payment_ref}')">✕</button>
            ` : ''}
          </div></td>
        </tr>`).join('')
      : `<tr><td colspan="7" class="empty">Chưa có đơn hàng</td></tr>`;

  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function upgradePlan(plan) {
  try {
    const r = await api('POST','/api/billing/create-order',{ plan });
    openQRModal(r, plan);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function upgradeWithStripe(plan) {
  try {
    toast('⏳ Đang tạo phiên thanh toán Stripe...','inf');
    const r = await api('POST','/api/billing/stripe/create-session',{ plan });
    if (r.url) window.open(r.url,'_blank');
    else toast('❌ Stripe chưa được cấu hình trên server','err');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// Thanh toán quốc tế thủ công (PayPal / Wise / Visa) — tạo đơn + hiện thông tin để copy
async function payInternational(plan) {
  const pl   = PLAN_LABELS[plan] || {};
  const usd  = (dbPlans[plan] && dbPlans[plan].price_usd_final != null) ? dbPlans[plan].price_usd_final : (pl.usd || '');
  const mod  = document.getElementById('intlPayMod');
  const info = document.getElementById('intlPayInfo');
  info.innerHTML = '<div class="empty">Đang tạo đơn...</div>';
  mod.classList.add('on');
  try {
    const order = await api('POST','/api/billing/create-order',{ plan });
    const methods = [
      ['💳','Stripe link',   platformPays.stripe],
      ['🅿️','PayPal',        platformPays.paypal],
      ['🟢','Wise',          platformPays.wise],
      ['💠','Thẻ Visa/Card', platformPays.visa],
    ].filter(m => m[2]);
    if (!methods.length) {
      info.innerHTML = '<div class="empty">Chủ ứng dụng chưa cấu hình thanh toán quốc tế. Vui lòng liên hệ hỗ trợ.</div>';
      return;
    }
    const rows = methods.map(([icon, label, val]) => {
      const isUrl = /^https?:\/\//i.test(val);
      const valHtml = isUrl
        ? `<a href="${sanitizeHTML(val)}" target="_blank" style="flex:1;color:var(--cyan);text-decoration:none;word-break:break-all">${sanitizeHTML(val)}</a>`
        : `<span style="flex:1;color:var(--text);word-break:break-all">${sanitizeHTML(val)}</span>`;
      return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="width:100px;flex-shrink:0;color:var(--muted);font-size:12px">${icon} ${label}</span>
        ${valHtml}
        <button class="btn btn-ghost" style="padding:2px 8px;font-size:10px;flex-shrink:0" data-copy="${sanitizeHTML(val)}" onclick="copyText(this.dataset.copy)">📋</button>
      </div>`;
    }).join('');
    info.innerHTML = `
      <div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px">
          <span>${pl.icon||''} Gói <strong>${pl.name||plan}</strong></span>
          <span style="font-family:var(--head);font-weight:800;color:var(--cyan)">$${usd} USD</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px">Mã đơn: <span style="font-family:monospace;color:var(--cyan)">${order.ref}</span>
          <button class="btn btn-ghost" style="padding:1px 6px;font-size:9px" data-copy="${order.ref}" onclick="copyText(this.dataset.copy)">📋</button></div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Chuyển <strong>$${usd}</strong> qua một trong các kênh dưới, ghi <strong>mã đơn ${order.ref}</strong> vào nội dung:</div>
      ${rows}
      <div style="font-size:11px;color:var(--amber);margin-top:10px;line-height:1.6">⚠️ Sau khi chuyển, gửi biên lai + mã đơn cho bộ phận hỗ trợ. Đơn đang ở trạng thái <strong>Chờ TT</strong>, sẽ được kích hoạt sau khi xác nhận.</div>
    `;
    loadBilling(); // cập nhật danh sách đơn ở nền
  } catch(e) {
    info.innerHTML = `<div class="empty">❌ ${e.message}</div>`;
  }
}
function closeIntlPay() { document.getElementById('intlPayMod').classList.remove('on'); }

function openQRModal(order, plan) {
  const pl = PLAN_LABELS[plan] || {};
  currentOrderRef = order.ref;

  // Fill modal data
  document.getElementById('qrPlanLabel').textContent = `${pl.icon||''} Nâng cấp gói ${pl.name||plan} — ${fmoney(order.amount)}`;
  document.getElementById('qrAmount').textContent    = fmoney(order.amount);
  document.getElementById('qrBank').textContent      = order.bank.bank_code || 'MB';
  document.getElementById('qrAccNo').textContent     = order.bank.account_no;
  document.getElementById('qrHolder').textContent    = order.bank.holder;
  document.getElementById('qrContent').textContent   = order.bank.content;

  // Load QR image
  const img = document.getElementById('qrImage');
  if (img) { img.alt = 'VietQR'; img.src = order.qr_url; }

  // Countdown timer
  const expiry = new Date(order.order_expires_at).getTime();
  clearInterval(qrTimerInterval);
  qrTimerInterval = setInterval(() => {
    const left = Math.max(0, expiry - Date.now());
    const m = String(Math.floor(left/60000)).padStart(2,'0');
    const s = String(Math.floor((left%60000)/1000)).padStart(2,'0');
    const el = document.getElementById('qrTimer');
    if (el) el.textContent = left > 0 ? `⏱ QR còn hiệu lực: ${m}:${s}` : '⌛ QR đã hết hạn';
    if (left === 0) clearInterval(qrTimerInterval);
  }, 1000);

  // Reset status
  document.getElementById('qrStatus').innerHTML = `
    <div class="qs-waiting"><span class="spin">⟳</span> Đang chờ thanh toán...</div>
    <div style="margin-top:10px;display:flex;gap:8px;justify-content:center">
      <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="closeQR()">Hủy đơn</button>
      <button class="btn btn-amber" style="font-size:11px;padding:5px 12px" onclick="checkPaymentManual()">✅ Tôi đã chuyển khoản</button>
    </div>`;

  document.getElementById('qrModal').classList.add('on');

  // Auto-poll mỗi 5 giây
  clearInterval(qrPollInterval);
  qrPollInterval = setInterval(pollOrderStatus, 5000);
}

async function pollOrderStatus() {
  if (!currentOrderRef) return;
  try {
    const r = await api('GET', `/api/billing/order/${currentOrderRef}/status`);
    if (r.status === 'active') {
      onPaymentSuccess(r);
    }
  } catch(e) { /* silent */ }
}

async function checkPaymentManual() {
  if (!currentOrderRef) return;
  try {
    const r = await api('GET', `/api/billing/order/${currentOrderRef}/status`);
    if (r.status === 'active') {
      onPaymentSuccess(r);
    } else {
      toast('⏳ Chưa nhận được thanh toán — hệ thống đang chờ xác nhận từ ngân hàng','inf');
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function onPaymentSuccess(data) {
  clearInterval(qrPollInterval);
  clearInterval(qrTimerInterval);
  playNotif();
  const el = document.getElementById('qrStatus');
  if (el) el.innerHTML = `
    <div class="qs-paid">
      🎉 Thanh toán thành công! Gói ${PLAN_LABELS[data.plan]?.name||data.plan} đã kích hoạt.
    </div>
    <div style="margin-top:10px">
      <button class="btn btn-cyan" style="width:200px;justify-content:center" onclick="closeQR();loadBilling()">✅ Đóng & Làm mới</button>
    </div>`;
  toast(`🎉 Gói ${PLAN_LABELS[data.plan]?.name||data.plan} đã kích hoạt!`);
}

function closeQR() {
  clearInterval(qrPollInterval);
  clearInterval(qrTimerInterval);
  currentOrderRef = null;
  document.getElementById('qrModal').classList.remove('on');
}

function copyQR(id) {
  const v = document.getElementById(id)?.textContent;
  if (v) { navigator.clipboard.writeText(v); toast('✅ Đã copy','inf'); }
}

async function confirmOrder(ref) {
  if (!confirm(`Xác nhận đã nhận tiền cho đơn ${ref}?`)) return;
  try {
    await api('POST','/api/billing/confirm',{ ref });
    toast('✅ Đã duyệt thanh toán');
    loadBilling();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function cancelOrder(ref) {
  if (!confirm(`Hủy đơn ${ref}?`)) return;
  try {
    await api('POST','/api/billing/cancel',{ ref });
    toast('🗑️ Đã hủy đơn');
    loadBilling();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function showQRAgain(ref) {
  try {
    const data  = await api('GET', '/api/billing');
    const order = (data.orders || []).find(o => o.payment_ref === ref);
    if (!order) { toast('Không tìm thấy đơn hàng', 'err'); return; }
    const bank    = data.bank;
    const content = `SALESKIT ${shopInfo.id} ${ref}`;
    const qrUrl   = `https://img.vietqr.io/image/${bank.bank_code}-${bank.account_no}-compact2.png?` +
      new URLSearchParams({ amount: order.amount, addInfo: content, accountName: bank.holder }).toString();
    openQRModal({
      ref,
      amount:           order.amount,
      qr_url:           qrUrl,
      order_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      bank: { bank_code: bank.bank_code, account_no: bank.account_no, holder: bank.holder, content },
    }, order.plan);
  } catch(e) { toast('❌ ' + e.message, 'err'); }
}

// ── WEBSOCKET REAL-TIME ───────────────────────────────────────────────
let socket = null;

function initSocket(shopId) {
  if (socket) socket.disconnect();
  socket = io(BASE, { auth: { token } });

  socket.on('connect', () => {
    socket.emit('join', shopId);
    setRTStatus(true);
  });
  socket.on('disconnect', () => setRTStatus(false));

  socket.on('message:new', (data) => {
    playNotif();
    const sent = SENT_INFO[data.sentiment] || SENT_INFO.neutral;
    const ch   = {facebook:'📘',zalo:'🟦',web:'🌐'}[data.channel] || '💬';
    toastRT(`${ch} Tin mới ${sent.icon} — "${(data.text||'').slice(0,40)}${data.text?.length>40?'…':''}"`);

    // Cập nhật badge inbox
    const b = document.getElementById('inboxBadge');
    if (b) { const cur=+b.textContent||0; b.textContent=cur+1; b.style.display=''; }

    // Refresh inbox nếu đang mở — kể cả khi chưa chọn conversation
    if (document.getElementById('page-inbox').classList.contains('on')) {
      api('GET','/api/inbox').then(convs => {
        inboxConvs = convs;
        renderInboxList();
        updateInboxBadge();
        // Nếu active conversation khớp với tin mới → reload messages
        if (activeConv &&
            activeConv.channel === data.channel &&
            (activeConv.sender_id||'') === (data.sender_id||'')) {
          openConversation(activeConv, true);
        }
      }).catch(() => {});
    }
  });

  socket.on('customer:new', (data) => {
    playNotif();
    toastRT(`👤 Khách mới: <strong>${data.name}</strong> (${data.source||data.status})`);
    // Cập nhật bộ đếm stats
    const s0 = document.getElementById('s0');
    if (s0) s0.textContent = +s0.textContent + 1;
    custs.unshift(data);
    if (document.getElementById('page-kanban').classList.contains('on')) renderKanban();
    if (document.getElementById('page-customers').classList.contains('on')) renderCust();
  });

  socket.on('customer:status', (data) => {
    toastRT(`🔄 ${data.name}: ${data.oldStatus} → <strong>${data.newStatus}</strong>`);
    const c = custs.find(x=>x.id==data.id);
    if (c) { c.status = data.newStatus; renderKanban(); }
  });

  socket.on('customer:assigned', (data) => {
    toastRT(`🎯 Đã chia "${data.name}" cho nhân viên`);
  });

  socket.on('billing:paid', (data) => {
    playNotif();
    const planName = PLAN_LABELS[data.plan]?.name || data.plan;
    toastRT(`🎉 Thanh toán ${fmoney(data.amount)} — Gói ${planName} đã kích hoạt!`);
    // Tự cập nhật QR modal nếu đang mở và đúng đơn
    if (currentOrderRef) onPaymentSuccess(data);
    // Reload billing nếu đang ở trang billing
    if (document.getElementById('page-billing').classList.contains('on')) loadBilling();
  });
}

function setRTStatus(connected) {
  const el = document.getElementById('rtStatus');
  if (!el) return;
  el.innerHTML = connected
    ? '<span style="color:var(--green)">🟢</span> Real-time'
    : '<span style="color:var(--red)">🔴</span> Offline';
}

function toastRT(msg) {
  const w = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast inf';
  t.innerHTML = `🔔 ${msg}`;
  w.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function playNotif() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch(e) {}
}

// ── KANBAN BOARD ──────────────────────────────────────────────────────
const KSTATUS = {
  new:   { label:'🆕 Mới',  color:'var(--cyan)'  },
  hot:   { label:'🔥 Hot',  color:'var(--pink)'  },
  close: { label:'✅ Chốt', color:'var(--green)' },
  cold:  { label:'❄️ Lạnh', color:'var(--muted)' },
};
const CH_ICON = { facebook:'📘', zalo:'🟦', web:'🌐' };

let dragId = null;

async function loadKanban() {
  try {
    custs = await api('GET','/api/customers');
    renderKanban();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function renderKanban() {
  const cols = { new:[], hot:[], close:[], cold:[] };
  custs.forEach(c => { if (cols[c.status]) cols[c.status].push(c); });
  Object.entries(cols).forEach(([status, list]) => {
    document.getElementById('kc-count-' + status).textContent = list.length;
    document.getElementById('kcc-' + status).innerHTML = list.map(c => {
      const sent = SENT_INFO[c.sentiment] || SENT_INFO.neutral;
      return `<div class="kcard" draggable="true" data-id="${c.id}"
          ondragstart="onDragStart(event,${c.id})"
          ondragend="onDragEnd(event)">
        <div style="position:absolute;top:8px;right:8px;font-size:14px" title="${sent.label}">${sent.icon}</div>
        <div class="kcard-name">${sanitizeHTML(c.name)}</div>
        <div class="kcard-phone">${sanitizeHTML(c.phone||'—')}</div>
        <div class="kcard-meta">
          ${c.score>0 ? `<span class="kcard-score">⚡ ${c.score}pt</span>` : ''}
          ${c.source ? `<span class="kcard-ch">${CH_ICON[c.source?.toLowerCase()]||''}${c.source}</span>` : ''}
        </div>
        <div style="display:flex;gap:5px;margin-top:8px">
          <button class="btn btn-ghost" style="padding:2px 7px;font-size:10px;flex:1" onclick="openEdit(${c.id})">✏️ Sửa</button>
          <button class="btn btn-purple" style="padding:2px 7px;font-size:10px" onclick="openTimeline(${c.id},'${c.name.replace(/'/g,"\\'")}')">📋</button>
        </div>
      </div>`;
    }).join('') || `<div style="text-align:center;padding:20px;color:var(--dim);font-size:12px">Kéo thả vào đây</div>`;
  });
}

function onDragStart(e, id) {
  dragId = id;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.kc').forEach(c => c.classList.remove('drag-over'));
}
function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
async function onDrop(e, col) {
  e.preventDefault();
  col.classList.remove('drag-over');
  const newStatus = col.dataset.status;
  const cust = custs.find(c => c.id === dragId);
  if (!cust || cust.status === newStatus) return;
  try {
    await api('PUT','/api/customers/'+dragId, { ...cust, status: newStatus });
    cust.status = newStatus;
    renderKanban();
    toast(`✅ ${cust.name} → ${KSTATUS[newStatus]?.label}`);
  } catch(e) { toast('❌ '+e.message,'err'); }
  dragId = null;
}

// ── SHARED INBOX ──────────────────────────────────────────────────────
let inboxConvs = [], activeConv = null, inboxPollTimer = null;

async function loadInbox() {
  try {
    inboxConvs = await api('GET','/api/inbox');
    renderInboxList();
    updateInboxBadge();
    // Bắt đầu polling mỗi 5 giây
    clearInterval(inboxPollTimer);
    inboxPollTimer = setInterval(pollInbox, 5000);
  } catch(e) { /* silent */ }
}

async function pollInbox() {
  // Chỉ poll khi đang ở trang inbox
  if (!document.getElementById('page-inbox').classList.contains('on')) {
    clearInterval(inboxPollTimer); return;
  }
  try {
    inboxConvs = await api('GET','/api/inbox');
    renderInboxList();
    updateInboxBadge();
    if (activeConv) {
      const updated = inboxConvs.find(c =>
        c.channel === activeConv.channel &&
        (c.sender_id||'') === (activeConv.sender_id||'')
      );
      if (updated) openConversation(updated, false);
    }
  } catch(e) { /* silent */ }
}

function updateInboxBadge() {
  const total = inboxConvs.reduce((s,c)=>s+(+c.unread||0),0);
  const b = document.getElementById('inboxBadge');
  if (b) { b.style.display = total>0?'':'none'; b.textContent = total; }
}

function renderInboxList() {
  const search = (document.getElementById('inboxSearch')?.value||'').toLowerCase();
  const list = inboxConvs.filter(c =>
    !search ||
    (c.cust_name||'').toLowerCase().includes(search) ||
    (c.sender_id||'').toLowerCase().includes(search) ||
    (c.text||'').toLowerCase().includes(search)
  );
  const icons = { facebook:'📘', zalo:'🟦', web:'🌐' };
  document.getElementById('inboxConvList').innerHTML = list.length
    ? list.map(c => {
        const isActive = activeConv && c.channel===activeConv.channel && (c.sender_id||'')===(activeConv.sender_id||'');
        const name = c.cust_name || c.sender_name || (c.sender_id ? c.channel+'_'+c.sender_id.slice(-6) : 'Web visitor');
        const sent = SENT_INFO[c.sentiment] || SENT_INFO.neutral;
        return `<div class="inbox-conv ${isActive?'active':''}"
            onclick='openConversation(${JSON.stringify(c).replace(/'/g,"&#39;")},true)'>
          <div class="inbox-av">${icons[c.channel]||'💬'}</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
              <span class="inbox-conv-name">${sanitizeHTML(name)}</span>
              <span style="font-size:13px" title="${sent.label}">${sent.icon}</span>
            </div>
            <div class="inbox-conv-preview">${c.direction==='out'?'🤖 ':''}${sanitizeHTML(c.text||'')}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
            <span class="inbox-conv-time">${fmtInboxTime(c.created_at)}</span>
            ${+c.unread>0 ? `<span class="inbox-badge">${c.unread}</span>` : ''}
          </div>
        </div>`;
      }).join('')
    : '<div class="empty" style="padding:24px">Chưa có tin nhắn</div>';
}

function filterInboxList() { renderInboxList(); }

function fmtInboxTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  const diff = (now-d)/1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff/60)}p`;
  if (diff < 86400) return d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
}

async function openConversation(conv, scroll=true) {
  activeConv = conv;
  renderInboxList();

  const icons = { facebook:'📘', zalo:'🟦', web:'🌐' };
  const name = conv.cust_name || conv.sender_name || (conv.sender_id ? conv.channel+'_'+conv.sender_id.slice(-6) : 'Web visitor');
  const sent = SENT_INFO[conv.sentiment] || SENT_INFO.neutral;

  // Load messages
  let msgs = [];
  try {
    msgs = await api('GET', `/api/inbox/messages?channel=${conv.channel}&sender_id=${encodeURIComponent(conv.sender_id||'')}`);
  } catch(e) { /* ignore */ }

  const main = document.getElementById('inboxMain');
  main.innerHTML = `
    <div class="inbox-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:22px">${icons[conv.channel]||'💬'}</div>
        <div>
          <div style="font-weight:700;font-size:14px">${sanitizeHTML(name)}</div>
          <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px">
            ${conv.channel} · ${sent.icon} ${sent.label}
            ${conv.sender_id ? `· ID: ${conv.sender_id.slice(-8)}` : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-cyan" style="font-size:11px;padding:4px 10px" onclick="orderFromInbox(${conv.customer_id||'null'},'${(name||'').replace(/'/g,"\\'")}','${(conv.cust_phone||'').replace(/'/g,"\\'")}')">🛒 Tạo đơn</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" onclick="toggleInboxSide()">👤 Khách</button>
        ${conv.customer_id ? `<button class="btn btn-purple" style="font-size:11px;padding:4px 10px" onclick="openTimeline(${conv.customer_id},'${name.replace(/'/g,"\\'")}'  )">📋 Timeline</button>` : ''}
      </div>
    </div>
    <div class="inbox-msgs" id="inboxMsgArea">
      ${msgs.map(m => {
        const s = SENT_INFO[m.sentiment]||SENT_INFO.neutral;
        return `<div class="imsg ${m.direction}">
          ${m.direction==='in' ? `<div style="width:28px;height:28px;border-radius:50%;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${icons[m.channel]||'💬'}</div>` : ''}
          <div>
            <div class="imsg-bubble">${sanitizeHTML(m.text||'').replace(/\n/g,'<br>')}</div>
            <div class="imsg-meta">
              ${m.direction==='in' ? s.icon+' · ' : m.ai_reply?'🤖 AI · ':m.staff_reply?'👤 Staff · ':''}
              ${fmtInboxTime(m.created_at)}
            </div>
          </div>
        </div>`;
      }).join('') || '<div class="empty">Chưa có tin nhắn</div>'}
    </div>
    <div class="inbox-reply">
      <textarea id="inboxReplyText" placeholder="Nhập tin nhắn trả lời..." rows="1"
        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendInboxReply()}"
        oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
      <button class="btn btn-cyan" onclick="sendInboxReply()" style="align-self:flex-end">➤ Gửi</button>
    </div>
  `;

  if (scroll) {
    setTimeout(() => {
      const area = document.getElementById('inboxMsgArea');
      if (area) area.scrollTop = area.scrollHeight;
    }, 50);
  }

  // Side panel
  renderInboxSide(conv);
}

function renderInboxSide(conv) {
  const side = document.getElementById('inboxSide');
  const sc   = document.getElementById('inboxSideContent');
  if (!side || !sc) return;
  side.style.display = 'flex';
  const cust = conv.customer_id ? custs.find(c=>c.id===conv.customer_id) : null;
  const sent = SENT_INFO[conv.sentiment]||SENT_INFO.neutral;
  sc.innerHTML = cust
    ? `<div style="font-weight:700;font-size:14px;margin-bottom:8px">${sanitizeHTML(cust.name)}</div>
       <div>📞 ${sanitizeHTML(cust.phone||'—')}</div>
       <div>📧 ${sanitizeHTML(cust.email||'—')}</div>
       <div>📍 ${sanitizeHTML(cust.source||'—')}</div>
       <div><span class="tag ${cust.status}">${statusLabel(cust.status)}</span></div>
       <div>⚡ ${cust.score||0} điểm</div>
       <div>${sent.icon} ${sent.label}</div>`
    : `<div style="color:var(--muted);font-size:12px;text-align:center;padding:16px 0">Chưa gán khách hàng<br><br>Bấm "Gán khách hàng" để liên kết cuộc hội thoại này với một khách trong CRM</div>`;
}

function toggleInboxSide() {
  const s = document.getElementById('inboxSide');
  if (s) s.style.display = s.style.display==='none' ? 'flex' : 'none';
}

async function sendInboxReply() {
  if (!activeConv) return;
  const txt = document.getElementById('inboxReplyText')?.value.trim();
  if (!txt) return;
  try {
    await api('POST','/api/inbox/reply',{
      channel:     activeConv.channel,
      sender_id:   activeConv.sender_id||null,
      text:        txt,
      customer_id: activeConv.customer_id||null,
    });
    document.getElementById('inboxReplyText').value='';
    await openConversation(activeConv, true);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function linkCustomerInbox() {
  if (!activeConv) return;
  const name = prompt('Tìm khách hàng (nhập tên hoặc SĐT):');
  if (!name) return;
  const found = custs.filter(c =>
    c.name.toLowerCase().includes(name.toLowerCase()) ||
    (c.phone||'').includes(name)
  );
  if (!found.length) { toast('Không tìm thấy khách hàng','err'); return; }
  const c = found[0];
  if (!confirm(`Gán cuộc hội thoại với "${c.name}"?`)) return;
  try {
    await api('POST','/api/inbox/link-customer',{
      channel: activeConv.channel, sender_id: activeConv.sender_id||null, customer_id: c.id
    });
    activeConv.customer_id = c.id; activeConv.cust_name = c.name;
    toast(`✅ Đã gán với ${c.name}`);
    await loadInbox();
    openConversation(activeConv, false);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function toggleSimPanel() {
  const p = document.getElementById('simPanel');
  if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

async function runSimulate() {
  const channel    = document.getElementById('simChannel').value;
  const sender_id  = document.getElementById('simSender').value.trim() || null;
  const text       = document.getElementById('simText').value.trim();
  if (!text) { toast('Nhập tin nhắn test','err'); return; }
  const btn = event.currentTarget; btn.disabled = true; btn.textContent = '⏳';
  try {
    const r = await api('POST','/api/dev/simulate', { channel, sender_id, text });
    document.getElementById('simResult').style.display = 'block';
    document.getElementById('simResult').innerHTML =
      `✅ Bot: "${r.reply.slice(0,80)}" · Sentiment: ${r.sentiment} · AI: ${r.aiGenerated}`;
    document.getElementById('simText').value = '';
    // Không cần gọi loadInbox() — WebSocket sẽ tự cập nhật
  } catch(e) {
    document.getElementById('simResult').style.display = 'block';
    document.getElementById('simResult').innerHTML = `❌ ${e.message}`;
  } finally { btn.disabled = false; btn.textContent = '▶ Gửi'; }
}

function openTimelineFromInbox() {
  if (!activeConv?.customer_id) { toast('Chưa gán khách hàng cho cuộc hội thoại này','err'); return; }
  openTimeline(activeConv.customer_id, activeConv.cust_name);
}

// ── CUSTOMER TIMELINE ─────────────────────────────────────────────────
async function openTimeline(customerId, name) {
  const modal = document.getElementById('tlModal');
  document.getElementById('tlName').textContent = '📋 Timeline: ' + name;
  const cust = custs.find(c=>c.id===customerId);
  document.getElementById('tlSub').textContent = cust
    ? `${statusLabel(cust.status)} · ${cust.phone||''} · ${cust.score||0}pt`
    : '';
  document.getElementById('tlBody').innerHTML = '<div class="empty">Đang tải...</div>';
  modal.classList.add('on');

  try {
    const timeline = await api('GET', `/api/customers/${customerId}/timeline`);
    if (!timeline.length) {
      document.getElementById('tlBody').innerHTML = '<div class="empty">Chưa có hoạt động nào</div>';
      return;
    }
    document.getElementById('tlBody').innerHTML = timeline.map(item => {
      let icon, iconBg, title, detail;
      if (item.type === 'message') {
        const isIn  = item.direction === 'in';
        const ch    = { facebook:'📘', zalo:'🟦', web:'🌐' }[item.channel]||'💬';
        const sent  = item.sentiment ? SENT_INFO[item.sentiment] : null;
        icon   = isIn ? ch : (item.ai_reply?'🤖':item.staff_reply?'👤':'💬');
        iconBg = isIn ? 'rgba(0,229,255,.1)' : 'rgba(124,58,237,.15)';
        title  = isIn
          ? `Khách nhắn (${item.channel})${sent?' '+sent.icon:''}`
          : item.ai_reply ? 'Bot AI trả lời' : item.staff_reply ? 'Nhân viên trả lời' : 'Bot trả lời';
        detail = item.text;
      } else if (item.type === 'score') {
        icon   = '⚡';
        iconBg = 'rgba(245,158,11,.15)';
        title  = 'Cộng điểm lead';
        detail = `${item.text} (+${item.score_delta}pt)`;
      } else {
        icon   = '📝';
        iconBg = 'rgba(16,185,129,.1)';
        title  = item.text;
        detail = item.channel;
      }
      return `<div class="tl-item">
        <div class="tl-icon" style="background:${iconBg}">${icon}</div>
        <div class="tl-content">
          <div class="tl-title">${title}</div>
          ${detail ? `<div class="tl-detail">${(detail||'').replace(/\n/g,'<br>').slice(0,200)}</div>` : ''}
          <div class="tl-time">${new Date(item.created_at).toLocaleString('vi-VN')}</div>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    document.getElementById('tlBody').innerHTML = `<div class="empty">Lỗi: ${e.message}</div>`;
  }
}

function closeTL() { document.getElementById('tlModal').classList.remove('on'); }

// ── AI CONFIG ─────────────────────────────────────────────────────────
const SENT_INFO = {
  angry:       { icon:'😡', label:'Giận dữ',   color:'#ef4444' },
  happy:       { icon:'😊', label:'Hài lòng',  color:'#10b981' },
  intent_buy:  { icon:'🔥', label:'Muốn mua',  color:'#f59e0b' },
  questioning: { icon:'🤔', label:'Thắc mắc',  color:'#00e5ff' },
  neutral:     { icon:'😐', label:'Trung lập', color:'#6b6b9a' },
};

async function loadAIConfig() {
  try {
    const cfg = await api('GET','/api/ai-config');
    document.getElementById('aiProvider').value     = cfg.provider || 'openai';
    document.getElementById('aiModel').value        = cfg.model    || 'gpt-4o-mini';
    document.getElementById('aiApiKey').value       = cfg.api_key  || '';
    document.getElementById('aiSystemPrompt').value = cfg.system_prompt || '';
    document.getElementById('aiEnabled').checked    = !!cfg.enabled;
    updateAIEnabledBadge(!!cfg.enabled);
    updateAIModelHint();
    loadSentimentStats();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function updateAIEnabledBadge(enabled) {
  const b = document.getElementById('aiEnabledBadge');
  if (!b) return;
  b.style.background = enabled ? 'rgba(16,185,129,.15)' : 'rgba(107,107,154,.15)';
  b.style.color      = enabled ? '#10b981' : '#6b6b9a';
  b.style.border     = `1px solid ${enabled ? 'rgba(16,185,129,.3)' : 'var(--border)'}`;
  b.textContent      = enabled ? '● Đang bật' : '○ Đang tắt';
}

function updateAIModelHint() {
  const prov  = document.getElementById('aiProvider')?.value || 'openai';
  const model = document.getElementById('aiModel');
  if (!model) return;
  Array.from(model.options).forEach(o => {
    const isGemini = o.value.startsWith('gemini');
    o.hidden = (prov === 'openai' && isGemini) || (prov === 'gemini' && !isGemini);
  });
  if (prov === 'gemini' && !model.value.startsWith('gemini')) model.value = 'gemini-2.5-flash';
  if (prov === 'openai' && model.value.startsWith('gemini'))  model.value = 'gpt-4o-mini';
}

// ── Tự nhận diện nhà cung cấp AI theo đầu API key ─────────────────────
function detectAIProvider(key) {
  const k = (key || '').trim();
  if (!k || /^[•*]+/.test(k)) return null;                 // rỗng hoặc đã mask
  if (/^AIza[\w-]+/i.test(k)) return { provider:'gemini',    model:'gemini-2.5-flash', label:'Google Gemini' };
  if (/^AQ\.[\w-]+/i.test(k)) return { provider:'gemini',    model:'gemini-2.5-flash', label:'Google Gemini' };
  if (/^sk-ant/i.test(k))     return { provider:'anthropic', model:'',                 label:'Anthropic' };
  if (/^sk-[\w-]+/i.test(k))  return { provider:'openai',    model:'gpt-4o-mini',      label:'OpenAI' };
  return { provider:null, label:null };                    // không nhận diện được
}
function setKeyHint(elId, detected) {
  const hint = document.getElementById(elId);
  if (!hint) return;
  if (!detected) { hint.textContent = ''; return; }
  if (detected.provider === 'anthropic') {
    hint.textContent = '🔎 Có vẻ là key Anthropic — app hiện hỗ trợ OpenAI & Gemini.';
    hint.style.color = 'var(--amber)'; return;
  }
  if (!detected.provider) {
    hint.textContent = 'ⓘ Chưa nhận diện được loại key — kiểm tra lại (OpenAI: sk-… · Gemini: AIza…).';
    hint.style.color = 'var(--muted)'; return;
  }
  hint.textContent = `🔎 Đã nhận diện: ${detected.label} → tự chọn nhà cung cấp + model.`;
  hint.style.color = 'var(--green)';
}
function onAIKeyInput() {
  const d = detectAIProvider(document.getElementById('aiApiKey').value);
  setKeyHint('aiKeyHint', d);
  if (d && d.provider && d.provider !== 'anthropic') {
    const prov = document.getElementById('aiProvider'); if (prov) prov.value = d.provider;
    updateAIModelHint();
    const model = document.getElementById('aiModel'); if (model && d.model) model.value = d.model;
  }
}
function onCopilotKeyInput() {
  const d = detectAIProvider(document.getElementById('spCopilotKey').value);
  setKeyHint('spCopilotHint', d);
  if (d && d.provider && d.provider !== 'anthropic') {
    const prov = document.getElementById('spCopilotProvider'); if (prov) prov.value = d.provider;
    const model = document.getElementById('spCopilotModel'); if (model && d.model) model.value = d.model;
  }
}

async function saveAIConfig() {
  try {
    await api('PUT','/api/ai-config',{
      provider:      document.getElementById('aiProvider').value,
      api_key:       document.getElementById('aiApiKey').value,
      model:         document.getElementById('aiModel').value,
      system_prompt: document.getElementById('aiSystemPrompt').value,
      enabled:       document.getElementById('aiEnabled').checked,
    });
    updateAIEnabledBadge(document.getElementById('aiEnabled').checked);
    toast('✅ Đã lưu cấu hình AI');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function testAI() {
  const msg = document.getElementById('aiTestMsg').value.trim();
  if (!msg) { toast('Nhập tin nhắn test','err'); return; }
  const btn = event.currentTarget; btn.textContent='⏳ Đang gọi AI...'; btn.disabled=true;
  try {
    const r = await api('POST','/api/ai-config/test',{text:msg});
    const el = document.getElementById('aiTestResult');
    el.style.display = 'block';
    document.getElementById('aiTestReply').textContent = r.ok ? r.reply : ('⚠️ ' + r.message);
    el.style.borderColor = r.ok ? 'rgba(124,58,237,.3)' : 'rgba(239,68,68,.3)';
    if (!r.ok) toast('⚠️ '+r.message,'err');
  } catch(e) { toast('❌ '+e.message,'err'); }
  finally { btn.textContent='🧠 Hỏi AI'; btn.disabled=false; }
}

async function loadSentimentStats() {
  try {
    const rows = await api('GET','/api/sentiment-stats');
    const total = rows.reduce((s,r)=>s+(+r.cnt),0);
    document.getElementById('sentimentStats').innerHTML = rows.length
      ? `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px">
          ${Object.entries(SENT_INFO).map(([key, info]) => {
            const row = rows.find(r=>r.sentiment===key);
            const cnt = row ? +row.cnt : 0;
            const pct = total ? Math.round(cnt/total*100) : 0;
            return `<div style="text-align:center;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:10px">
              <div style="font-size:24px;margin-bottom:4px">${info.icon}</div>
              <div style="font-size:18px;font-weight:800;font-family:var(--head);color:${info.color}">${cnt}</div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px">${info.label}</div>
              <div style="font-size:9px;color:var(--dim);margin-top:2px">${pct}%</div>
            </div>`;
          }).join('')}
        </div>
        <div style="font-size:11px;color:var(--muted)">Tổng ${total} tin nhắn đã phân tích sắc thái</div>`
      : '<div class="empty">Chưa có dữ liệu — gửi vài tin nhắn test để xem phân tích</div>';
  } catch(e) { /* ignore */ }
}

// ── LEAD SCORING ──────────────────────────────────────────────────────
async function loadLeads() {
  try {
    const leads = await api('GET','/api/leads');
    const stats = {
      hot:    leads.filter(l=>l.status==='hot').length,
      close:  leads.filter(l=>l.status==='close').length,
      avgScore: leads.length ? Math.round(leads.reduce((s,l)=>s+(+l.score||0),0)/leads.length) : 0,
      maxScore: leads.length ? Math.max(...leads.map(l=>+l.score||0)) : 0,
    };

    document.getElementById('scoringStats').innerHTML = [
      { label:'Top điểm',   val: stats.maxScore, icon:'🏆', color:'c0' },
      { label:'Trung bình', val: stats.avgScore, icon:'📊', color:'c1' },
      { label:'Hot leads',  val: stats.hot,      icon:'🔥', color:'c2' },
      { label:'Đã chốt',   val: stats.close,    icon:'✅', color:'c3' },
    ].map(s=>`<div class="stat ${s.color}" style="padding:14px 16px">
      <div class="stat-lbl">${s.label}</div>
      <div class="stat-val">${s.val}</div>
      <div class="stat-icon">${s.icon}</div>
    </div>`).join('');

    document.getElementById('leadsTb').innerHTML = leads.length
      ? leads.map((l,i) => {
          const sent = SENT_INFO[l.sentiment] || SENT_INFO.neutral;
          const scoreColor = l.score>=80 ? 'var(--pink)' : l.score>=40 ? 'var(--amber)' : 'var(--muted)';
          return `<tr>
            <td style="padding:10px 20px">
              <div class="cell-name">
                <div style="width:24px;height:24px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${i+1}</div>
                <div><div style="font-weight:600">${l.name}</div><div style="font-size:10px;color:var(--muted)">${l.phone||'–'}</div></div>
              </div>
            </td>
            <td>
              <div style="font-family:var(--head);font-size:18px;font-weight:800;color:${scoreColor}">${l.score||0}</div>
              <div style="width:60px;height:4px;background:var(--border);border-radius:2px;margin-top:3px">
                <div style="width:${Math.min(100,(l.score||0)/1.5)}%;height:100%;background:${scoreColor};border-radius:2px;transition:width .3s"></div>
              </div>
            </td>
            <td><span title="${sent.label}" style="font-size:18px">${sent.icon}</span> <span style="font-size:11px;color:${sent.color}">${sent.label}</span></td>
            <td><span class="tag ${l.status}">${statusLabel(l.status)}</span></td>
            <td style="font-size:11px;color:var(--muted)">${fd(l.created_at)}</td>
            <td>
              <div style="display:flex;gap:5px">
                <button class="btn btn-ghost" style="padding:3px 9px;font-size:10px" onclick="openEdit(${l.id})">✏️</button>
                <button class="btn btn-amber" style="padding:3px 9px;font-size:10px" onclick="addManualScore(${l.id})">+điểm</button>
              </div>
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="6" class="empty">Chưa có dữ liệu khách hàng</td></tr>`;
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function addManualScore(id) {
  const delta = prompt('Thêm bao nhiêu điểm? (số âm để trừ)', '10');
  if (!delta || isNaN(+delta)) return;
  try {
    await api('POST','/api/leads/'+id+'/score',{ event_type:'Thêm thủ công', score_delta:+delta });
    toast(`✅ Đã ${+delta>0?'cộng':'trừ'} ${Math.abs(+delta)} điểm`);
    loadLeads();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── TEAM MANAGEMENT ───────────────────────────────────────────────────
let teamMembers = [];
let selectedAgentId = null;

async function loadTeam() {
  try {
    teamMembers = await api('GET','/api/team');
    if (!custs.length) custs = await api('GET','/api/customers');
    _renderTeamStats();
    _renderTeamList();
    if (selectedAgentId) {
      const m = teamMembers.find(m=>m.id===selectedAgentId);
      if (m) renderAgentDetail(m);
    }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function _renderTeamStats() {
  const total    = teamMembers.length;
  const agents   = teamMembers.filter(m=>m.role==='agent').length;
  const assigned = teamMembers.reduce((s,m)=>s+m.assigned_count,0);
  const closed   = teamMembers.reduce((s,m)=>s+m.closed_count,0);
  document.getElementById('teamStats').innerHTML = [
    { label:'Tổng NV',      val:total,    icon:'👥', color:'c0' },
    { label:'Agents',       val:agents,   icon:'🧑', color:'c1' },
    { label:'KH được chia', val:assigned, icon:'🎯', color:'c2' },
    { label:'Đã chốt',      val:closed,   icon:'✅', color:'c3' },
  ].map(s=>`<div class="stat ${s.color}" style="padding:14px 16px">
    <div class="stat-lbl">${s.label}</div>
    <div class="stat-val">${s.val}</div>
    <div class="stat-icon">${s.icon}</div>
  </div>`).join('');
}

function _renderTeamList() {
  const colors = ['#7c3aed','#00e5ff','#f472b6','#10b981','#f59e0b'];
  document.getElementById('teamList').innerHTML = teamMembers.map((m,i) => {
    const cr     = m.assigned_count > 0 ? Math.round(m.closed_count/m.assigned_count*100) : 0;
    const isSelf = m.id === myUserId;
    const isSel  = m.id === selectedAgentId;
    return `<div class="member-card${isSel?' sel':''}" onclick="selectAgent(${m.id})">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:${colors[i%colors.length]};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;flex-shrink:0">${m.username[0].toUpperCase()}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-weight:600;font-size:13px">${m.username}</span>
            ${isSelf?'<span style="font-size:9px;color:var(--cyan);background:rgba(0,229,255,.1);padding:1px 6px;border-radius:10px;font-weight:700">bạn</span>':''}
            <span class="role-badge role-${m.role}">${m.role==='admin'?'👑 Admin':'🧑 Agent'}</span>
          </div>
          <div class="member-meta">
            <span>🎯 ${m.assigned_count} KH</span>
            <span>✅ ${m.closed_count} chốt</span>
            <span>📈 ${cr}% CR</span>
            ${m.last_active?`<span>⏱ ${fmtInboxTime(m.last_active)}</span>`:''}
          </div>
          <div class="perf-bar"><div class="perf-bar-fill" style="width:${cr}%"></div></div>
        </div>
        ${!isSelf?`<button class="btn btn-red" style="padding:2px 7px;font-size:10px;flex-shrink:0" onclick="event.stopPropagation();deleteMember(${m.id},'${m.username}')">✕</button>`:''}
      </div>
    </div>`;
  }).join('') || '<div class="empty" style="padding:20px">Chưa có thành viên</div>';
}

async function selectAgent(id) {
  selectedAgentId = id;
  document.querySelectorAll('.member-card').forEach((c,i) => {
    c.classList.toggle('sel', teamMembers[i]?.id === id);
  });
  const member = teamMembers.find(m=>m.id===id);
  if (member) await renderAgentDetail(member);
}

async function renderAgentDetail(member) {
  const colors = ['#7c3aed','#00e5ff','#f472b6','#10b981','#f59e0b'];
  const idx    = teamMembers.findIndex(m=>m.id===member.id);
  const color  = colors[idx%colors.length];
  const cr     = member.assigned_count > 0 ? Math.round(member.closed_count/member.assigned_count*100) : 0;
  const isSelf = member.id === myUserId;

  let assignedCusts = [];
  try { assignedCusts = await api('GET',`/api/team/${member.id}/customers`); } catch(e) {}

  const assignedIds    = new Set(assignedCusts.map(c=>c.id));
  const availableCusts = custs.filter(c=>!assignedIds.has(c.id));

  document.getElementById('agentDetailWrap').innerHTML = `
  <div class="agent-panel">
    <div class="agent-panel-hd">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:46px;height:46px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff">${member.username[0].toUpperCase()}</div>
          <div>
            <div style="font-family:var(--head);font-size:16px;font-weight:700">${member.username}</div>
            <div style="font-size:11px;color:var(--muted)">Thành viên từ ${fd(member.created_at)}</div>
          </div>
        </div>
        ${!isSelf?`<button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="resetPasswordModal(${member.id},'${member.username}')">🔑 Reset mật khẩu</button>`:''}
      </div>
    </div>
    <div class="agent-panel-body">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">
        <div style="text-align:center;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:10px">
          <div style="font-size:22px;font-weight:800;font-family:var(--head);color:var(--cyan)">${member.assigned_count}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px">KH phụ trách</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:10px">
          <div style="font-size:22px;font-weight:800;font-family:var(--head);color:var(--green)">${member.closed_count}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px">Đã chốt</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:10px">
          <div style="font-size:22px;font-weight:800;font-family:var(--head);color:var(--amber)">${cr}%</div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px">Tỉ lệ chốt</div>
        </div>
      </div>

      ${!isSelf?`
      <div style="margin-bottom:20px">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Phân quyền</div>
        <div class="role-toggle">
          <button class="role-btn${member.role==='agent'?' on-agent':''}" onclick="changeRole(${member.id},'agent')">🧑 Agent</button>
          <button class="role-btn${member.role==='admin'?' on-admin':''}" onclick="changeRole(${member.id},'admin')">👑 Admin</button>
        </div>
      </div>`:''}

      <div style="margin-bottom:20px">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Chia khách hàng (bulk)</div>
        ${availableCusts.length?`
        <select class="bulk-select" id="bulkAssignSelect" multiple>
          ${availableCusts.slice(0,100).map(c=>`<option value="${c.id}">${c.name}${c.phone?' · '+c.phone:''}</option>`).join('')}
        </select>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">Giữ Ctrl+Click để chọn nhiều</div>
        <button class="btn btn-purple" style="width:100%;justify-content:center;margin-top:8px" onclick="bulkAssign(${member.id},'${member.username}')">🎯 Chia cho ${member.username}</button>
        `:`<div style="font-size:12px;color:var(--muted)">Tất cả khách đã được chia cho nhân viên này</div>`}
      </div>

      <div>
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Đang phụ trách (${assignedCusts.length} khách)</div>
        ${assignedCusts.length?assignedCusts.map(c=>{
          const sent=SENT_INFO[c.sentiment]||SENT_INFO.neutral;
          return `<div class="cust-assign-row">
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:12.5px">${c.name}</div>
              <div style="font-size:11px;color:var(--muted)">${c.phone||'–'} · <span class="tag ${c.status}" style="font-size:9px;padding:1px 5px">${statusLabel(c.status)}</span> ${sent.icon}${c.score>0?` <span style="color:var(--amber);font-weight:700">⚡${c.score}pt</span>`:''}</div>
            </div>
            <button class="btn btn-ghost" style="padding:2px 8px;font-size:10px;flex-shrink:0" onclick="unassignCustomer(${c.id},${member.id})">✕ Hủy</button>
          </div>`;
        }).join(''):'<div class="empty" style="padding:12px 0;text-align:center">Chưa có khách nào</div>'}
      </div>
    </div>
  </div>`;
}

async function changeRole(id, role) {
  try {
    await api('PUT',`/api/team/${id}/role`,{ role });
    toast(`✅ Đã đổi thành ${role==='admin'?'Admin':'Agent'}`);
    await loadTeam();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function resetPasswordModal(id, username) {
  const pw = prompt(`Mật khẩu mới cho "${username}" (tối thiểu 4 ký tự):`);
  if (!pw) return;
  if (pw.length < 4) { toast('Mật khẩu phải từ 4 ký tự','err'); return; }
  try {
    await api('PUT',`/api/team/${id}/reset-password`,{ password: pw });
    toast(`✅ Đã đặt lại mật khẩu cho ${username}`);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function bulkAssign(userId, username) {
  const sel = document.getElementById('bulkAssignSelect');
  if (!sel) return;
  const ids = Array.from(sel.selectedOptions).map(o=>+o.value);
  if (!ids.length) { toast('Chọn ít nhất 1 khách hàng','err'); return; }
  try {
    const r = await api('POST','/api/team/bulk-assign',{ user_id:userId, customer_ids:ids });
    if (r.assigned === 0) { toast('⚠️ Tất cả khách đã được chia cho nhân viên này rồi','inf'); return; }
    toast(`✅ Đã chia ${r.assigned} khách cho ${username}`);
    const m = teamMembers.find(m=>m.id===userId);
    if (m) { m.assigned_count += r.assigned; await renderAgentDetail(m); _renderTeamStats(); _renderTeamList(); }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function unassignCustomer(customerId, userId) {
  const member = teamMembers.find(m=>m.id===userId);
  if (!confirm(`Hủy chia khách này khỏi ${member?.username||'agent'}?`)) return;
  try {
    await api('DELETE',`/api/team/assign/${customerId}/${userId}`);
    toast('✅ Đã hủy chia khách');
    if (member) { member.assigned_count = Math.max(0, member.assigned_count-1); _renderTeamStats(); _renderTeamList(); await renderAgentDetail(member); }
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function addMember() {
  const username = document.getElementById('newMemberUser').value.trim();
  const password = document.getElementById('newMemberPass').value;
  const role     = document.getElementById('newMemberRole').value;
  if (!username || !password) { toast('Điền đủ username và mật khẩu','err'); return; }
  try {
    await api('POST','/api/team',{ username, password, role });
    toast(`✅ Đã tạo tài khoản ${username} (${role})`);
    document.getElementById('newMemberUser').value='';
    document.getElementById('newMemberPass').value='';
    loadTeam();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteMember(id, name) {
  if (!confirm(`Xóa tài khoản "${name}"?`)) return;
  try {
    await api('DELETE','/api/team/'+id);
    toast(`🗑️ Đã xóa ${name}`);
    if (selectedAgentId === id) { selectedAgentId = null; document.getElementById('agentDetailWrap').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:280px;background:var(--s1);border:1px solid var(--border);border-radius:14px"><div style="text-align:center;color:var(--muted)"><div style="font-size:36px;margin-bottom:10px">👈</div><div style="font-size:13px">Chọn nhân viên để xem chi tiết</div></div></div>'; }
    loadTeam();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── CONVERSION FUNNEL ──────────────────────────────────────────────────
let funnelChart = null;

async function loadFunnel() {
  try {
    const data = await api('GET','/api/reports/funnel');
    const { counts, rates, transitions } = data;

    // Stats cards
    document.getElementById('funnelStats').innerHTML = [
      { label:'Tổng KH',   val:counts.total,  icon:'👥', color:'c0', sub: `TB ${counts.avg_score}pt` },
      { label:'New→Hot',   val:rates.new_to_hot+'%', icon:'🔥', color:'c2', sub:`${counts.hot} Hot + ${counts.close} Chốt` },
      { label:'Hot→Chốt', val:rates.hot_to_close+'%', icon:'✅', color:'c1', sub:`${counts.close} đã chốt đơn` },
      { label:'Tổng CR',   val:rates.overall+'%', icon:'🏆', color:'c3', sub:`${counts.close}/${counts.total} khách` },
    ].map(s=>`<div class="stat ${s.color}">
      <div class="stat-lbl">${s.label}</div>
      <div class="stat-val">${s.val}</div>
      <div class="stat-sub">${s.sub}</div>
      <div class="stat-icon">${s.icon}</div>
    </div>`).join('');

    // Funnel visualization
    const total  = counts.total || 1;
    const steps  = [
      { label:'🆕 Mới đổ về',  count: counts.total,  color:'#00e5ff', pct: 100 },
      { label:'🔥 Chuyển Hot',  count: counts.hot + counts.close, color:'#f59e0b',
        pct: Math.round((counts.hot+counts.close)/total*100) },
      { label:'✅ Chốt đơn',   count: counts.close, color:'#10b981',
        pct: Math.round(counts.close/total*100) },
    ];
    document.getElementById('funnelViz').innerHTML = `<div class="funnel-wrap">
      ${steps.map((s,i) => `
        ${i>0 ? `<div class="funnel-arrow">↓ ${steps[i].pct}%</div>` : ''}
        <div class="funnel-step">
          <div class="funnel-info">${s.count} khách</div>
          <div class="funnel-bar-wrap">
            <div class="funnel-bar" style="width:${Math.max(s.pct,8)}%;background:linear-gradient(90deg,${s.color}cc,${s.color}88)">
              ${s.label}
              <span class="funnel-rate">${s.pct}%</span>
            </div>
          </div>
        </div>
      `).join('')}
      ${counts.cold>0 ? `<div class="funnel-arrow" style="color:var(--muted)">❄️ ${counts.cold} lạnh (${Math.round(counts.cold/total*100)}%)</div>` : ''}
    </div>`;

    // Transitions
    document.getElementById('funnelTransitions').innerHTML = transitions.length
      ? transitions.slice(0,8).map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:12.5px">${t.detail}</span>
            <span style="font-family:var(--head);font-weight:700;color:var(--cyan)">${t.cnt}×</span>
          </div>`).join('')
      : '<div class="empty">Chưa có chuyển đổi nào — hãy kéo thả Kanban!</div>';

    // Rate display
    document.getElementById('funnelRates').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${[
          { label:'New → Hot',  pct: rates.new_to_hot,   color:'var(--amber)' },
          { label:'Hot → Chốt',pct: rates.hot_to_close, color:'var(--green)' },
          { label:'Tổng CR',   pct: rates.overall,       color:'var(--cyan)' },
        ].map(r=>`<div>
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:12px;color:var(--muted)">${r.label}</span>
            <span style="font-weight:700;color:${r.color}">${r.pct}%</span>
          </div>
          <div style="height:6px;background:var(--border);border-radius:3px">
            <div style="width:${r.pct}%;height:100%;background:${r.color};border-radius:3px;transition:width .6s"></div>
          </div>
        </div>`).join('')}
      </div>`;
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── GHI ĐÈ go() ĐỂ HANDLE TRANG MỚI ────────────────────────────────
const _go = go;
go = async function(id) {
  // Dừng inbox polling khi rời khỏi inbox
  if (id !== 'inbox' && inboxPollTimer) { clearInterval(inboxPollTimer); inboxPollTimer = null; }
  await _go(id);
  if (id === 'kanban')  loadKanban();
  if (id === 'inbox')   loadInbox();
  if (id === 'aiconfig') loadAIConfig();
  if (id === 'leads')    loadLeads();
  if (id === 'funnel')   loadFunnel();
  if (id === 'team') { if (custs.length === 0) custs = await api('GET','/api/customers'); loadTeam(); }
};

// Cập nhật customer list — hiện sentiment + score
const _renderCust = renderCust;
renderCust = function() {
  _renderCust();
  // Thêm cột score/sentiment vào bảng khách hàng nếu có dữ liệu
  const rows = document.querySelectorAll('#custTb tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      const custId = row.querySelector('[onclick*="openEdit"]')?.getAttribute('onclick')?.match(/\d+/)?.[0];
      if (custId) {
        const c = custs.find(x=>x.id===+custId);
        if (c && (c.score||c.sentiment)) {
          const sent = SENT_INFO[c.sentiment] || SENT_INFO.neutral;
          cells[4].innerHTML += ` <span title="${sent.label}" style="margin-left:4px">${sent.icon}</span>`;
          if (c.score > 0) cells[3].innerHTML += `<div style="font-size:9px;color:var(--amber);margin-top:2px">⚡ ${c.score}pt</div>`;
        }
      }
    }
  });
};

// ── LOGIN TABS ────────────────────────────────────────────────────────
function switchLoginTab(tab) {
  document.getElementById('formShop').style.display  = tab === 'shop'  ? 'block' : 'none';
  document.getElementById('formSuper').style.display = tab === 'super' ? 'block' : 'none';
  document.getElementById('tabShop').classList.toggle('on',  tab === 'shop');
  document.getElementById('tabSuper').classList.toggle('on', tab === 'super');
}
function showRegister(show) {
  document.getElementById('formShopLogin').style.display    = show ? 'none'  : 'block';
  document.getElementById('formShopRegister').style.display = show ? 'block' : 'none';
}

// ── SELF-REGISTRATION ─────────────────────────────────────────────────
async function registerShop() {
  const shopName = document.getElementById('rName').value.trim();
  const username = document.getElementById('rUser').value.trim();
  const password = document.getElementById('rPass').value;
  if (!shopName || !username || !password) { toast('Điền đầy đủ thông tin','err'); return; }
  try {
    const r = await fetch(`${BASE}/api/shops/register`, {
      method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'true'},
      body: JSON.stringify({ shopName, username, password })
    });
    const data = await r.json();
    if (!r.ok) { toast('❌ '+data.error,'err'); return; }
    toast(`✅ Tạo thành công! Shop ID: ${data.shopId}`);
    showRegister(false);
    document.getElementById('lshop').value = data.shopId;
    document.getElementById('lu').value    = data.username;
    document.getElementById('lp').value    = '';
    setTimeout(() => toast(`👆 Điền mật khẩu rồi đăng nhập nhé!`,'inf'), 1500);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── SUPER ADMIN ───────────────────────────────────────────────────────
let superToken = localStorage.getItem('sk_super_token');

async function loginSuper() {
  const username = document.getElementById('sUser').value.trim();
  const password = document.getElementById('sPass').value;
  if (!username || !password) { toast('Điền đầy đủ','err'); return; }
  try {
    const r = await fetch(`${BASE}/api/super/login`, {
      method:'POST', headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'true'},
      body: JSON.stringify({ username, password })
    });
    const data = await r.json();
    if (!r.ok) { toast('❌ '+data.error,'err'); return; }
    superToken = data.token;
    localStorage.setItem('sk_super_token', superToken);
    document.getElementById('loginOv').style.display = 'none';
    document.getElementById('superOv').classList.add('on');
    loadSuperDashboard();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function logoutSuper() {
  superToken = null;
  localStorage.removeItem('sk_super_token');
  document.getElementById('superOv').classList.remove('on');
  document.getElementById('loginOv').style.display = 'flex';
  switchLoginTab('super');
}

async function superApi(method, path, body) {
  const opts = { method, headers: { 'Content-Type':'application/json', Authorization:'Bearer '+superToken, 'ngrok-skip-browser-warning':'true' } };
  if (body) opts.body = JSON.stringify(body);
  const r    = await fetch(BASE + path, opts);
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

async function loadSuperDashboard() {
  try {
    const [stats, shops, bank, contact, payments, stripe] = await Promise.all([
      superApi('GET','/api/super/dashboard'),
      superApi('GET','/api/super/shops'),
      superApi('GET','/api/super/bank-config'),
      fetch(`${BASE}/api/platform-contact`).then(r=>r.json()).catch(()=>({})),
      superApi('GET','/api/super/payment-methods').catch(()=>({})),
      superApi('GET','/api/super/stripe-config').catch(()=>({})),
    ]);
    const copilot = await superApi('GET','/api/super/copilot-config').catch(()=>({}));

    // Bank config
    const bc = document.getElementById('spBankCode');
    const ba = document.getElementById('spBankAccount');
    const bh = document.getElementById('spBankHolder');
    const bw = document.getElementById('spWebhookUrl');
    if (bc) bc.value = bank.bank_code || 'MB';
    if (ba) ba.value = bank.account_no || '';
    if (bh) bh.value = bank.holder_name || '';
    if (bw) bw.textContent = `${BASE}/api/billing/webhook/bank?secret=<BANK_WEBHOOK_SECRET từ .env>`;

    // Contact info
    const ce = document.getElementById('spContactEmail');
    const cp = document.getElementById('spContactPhone');
    const cn = document.getElementById('spContactNote');
    const ctg = document.getElementById('spContactTelegram');
    const cwa = document.getElementById('spContactWhatsapp');
    if (ce) ce.value = contact.email || '';
    if (cp) cp.value = contact.phone || '';
    if (cn) cn.value = contact.note  || '';
    if (ctg) ctg.value = contact.telegram || '';
    if (cwa) cwa.value = contact.whatsapp || '';

    // International payment methods
    const ps = document.getElementById('spPayStripe');
    const pp = document.getElementById('spPayPaypal');
    const pw = document.getElementById('spPayWise');
    const pv = document.getElementById('spPayVisa');
    if (ps) ps.value = payments.stripe || '';
    if (pp) pp.value = payments.paypal || '';
    if (pw) pw.value = payments.wise   || '';
    if (pv) pv.value = payments.visa   || '';

    // Stripe Checkout (tự động)
    const ssk = document.getElementById('spStripeSecret');
    const swh = document.getElementById('spStripeWebhook');
    const sst = document.getElementById('spStripeStatus');
    const swu = document.getElementById('spStripeWebhookUrl');
    if (ssk) ssk.value = stripe.secret_key || '';
    if (swh) swh.value = stripe.webhook_secret || '';
    if (swu) swu.textContent = `${BASE}/api/billing/stripe/webhook`;
    if (sst) {
      const on = stripe.has_key || stripe.env_fallback;
      sst.textContent = on ? '● Đang bật' : '○ Đang tắt';
      sst.style.background = on ? 'rgba(16,185,129,.15)' : 'rgba(120,120,150,.15)';
      sst.style.color = on ? 'var(--green)' : 'var(--muted)';
    }

    // Copilot (trợ lý AI hướng dẫn)
    const cpp = document.getElementById('spCopilotProvider');
    const cpm = document.getElementById('spCopilotModel');
    const cpk = document.getElementById('spCopilotKey');
    const cps = document.getElementById('spCopilotStatus');
    if (cpp) cpp.value = copilot.provider || 'openai';
    if (cpm) cpm.value = copilot.model || 'gpt-4o-mini';
    if (cpk) cpk.value = copilot.api_key || '';
    if (cps) {
      const on = copilot.has_key || copilot.env_fallback;
      cps.textContent = on ? '● Đang bật' : '○ Đang tắt';
      cps.style.background = on ? 'rgba(16,185,129,.15)' : 'rgba(120,120,150,.15)';
      cps.style.color = on ? 'var(--green)' : 'var(--muted)';
    }

    // Stats cards
    document.getElementById('superStats').innerHTML = [
      { label:'Tổng shops',        val: stats.total_shops,    icon:'🏪', color:'c0' },
      { label:'Mới tháng này',     val: stats.new_this_month, icon:'✨', color:'c1' },
      { label:'Sub đang active',   val: stats.active_subs,    icon:'⚡', color:'c2' },
      { label:'Tổng doanh thu',    val: fmoney(stats.total_revenue), icon:'💰', color:'c3' },
    ].map(s=>`<div class="stat ${s.color}" style="padding:16px">
      <div class="stat-lbl">${s.label}</div>
      <div class="stat-val" style="font-size:${typeof s.val==='string'?'18':'28'}px">${s.val}</div>
      <div class="stat-icon">${s.icon}</div>
    </div>`).join('');

    // Shop list
    const planColors = { free:'var(--muted)', basic:'var(--green)', pro:'var(--cyan)', enterprise:'var(--purple)' };
    const planIcons  = { free:'🌱', basic:'🚀', pro:'⚡', enterprise:'💎' };
    document.getElementById('superShopList').innerHTML = shops.length
      ? shops.map(s=>`<div class="shop-row">
          <div>
            <div style="font-weight:600;font-size:13px">${s.name}</div>
            <div style="font-size:10px;color:var(--muted);font-family:monospace">${s.id}</div>
          </div>
          <div><span style="color:${planColors[s.plan]||'var(--muted)'};">${planIcons[s.plan]||''} ${s.plan}</span>
            ${s.active_bill?`<div style="font-size:9px;color:var(--muted)">đến ${new Date(s.active_bill.expires_at).toLocaleDateString('vi-VN')}</div>`:''}
          </div>
          <div style="text-align:center">${s.customer_count}</div>
          <div style="text-align:center">${s.message_count}</div>
          <div style="text-align:center">${s.user_count}</div>
          <div style="font-size:11px;color:var(--muted)">${fd(s.created_at)}</div>
          <div style="display:flex;gap:5px">
            <button class="btn btn-ghost" style="padding:3px 8px;font-size:10px" onclick="impersonateShop('${s.id}','${s.name}')">🔑 Vào</button>
            <button class="btn btn-red"   style="padding:3px 8px;font-size:10px" onclick="deleteShop('${s.id}','${s.name}')">🗑️</button>
          </div>
        </div>`).join('')
      : '<div class="empty" style="padding:20px">Chưa có shop nào</div>';

    loadSuperOrders();
    loadSuperPlans();
    loadMonitor();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// ── GIÁM SÁT HỆ THỐNG REALTIME ─────────────────────────────────────────
const MON_COLOR = { ok:'var(--green)', warning:'var(--amber)', predict:'#f59e0b', critical:'var(--red)', unknown:'var(--muted)' };
const MON_LABEL = { ok:'🟢 Ổn định', warning:'🟠 Cảnh báo', predict:'⏰ Dự báo rủi ro', critical:'🔴 Nguy hiểm', unknown:'… Đang đọc' };
let _lastMonOverall = 'ok';
function fmtUptime(s){ const h=Math.floor(s/3600), m=Math.floor((s%3600)/60); return h?`${h}h ${m}m`:`${m}m`; }
async function loadMonitor() {
  if (!superToken) return;
  try { renderMonitor(await superApi('GET','/api/super/monitor')); } catch(e) { /* im lặng */ }
}
function renderMonitor(m) {
  const ob = document.getElementById('monOverall');
  const hb = document.getElementById('sysHealthBadge');
  [ob, hb].forEach(el => { if(el){ el.textContent = MON_LABEL[m.overall]||m.overall; el.style.color = MON_COLOR[m.overall]; el.style.borderColor = MON_COLOR[m.overall]; }});
  if (ob) ob.style.border = '1px solid '+MON_COLOR[m.overall];

  const al = document.getElementById('monAlerts');
  if (al) al.innerHTML = (m.alerts||[]).length
    ? m.alerts.map(a=>`<div style="padding:9px 12px;border-radius:8px;margin-bottom:6px;font-size:12.5px;line-height:1.5;background:${a.level==='critical'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)'};border:1px solid ${a.level==='critical'?'var(--red)':'var(--amber)'};color:var(--text)">${a.msg}</div>`).join('')
    : '<div style="padding:9px 12px;border-radius:8px;background:rgba(16,185,129,.08);border:1px solid var(--green);font-size:12.5px;color:var(--green)">✅ Hệ thống ổn định — sẽ báo trước ~10 phút nếu có dấu hiệu quá tải.</div>';

  const mm = document.getElementById('monMetrics');
  if (mm) mm.innerHTML = Object.values(m.metrics||{}).map(x=>{
    const pct = x.crit ? Math.min(100, Math.round((Math.max(0,x.value)/x.crit)*100)) : 0;
    const col = MON_COLOR[x.status]||MON_COLOR.unknown;
    const eta = (x.predict && x.predict.etaMin!=null && x.predict.etaMin<=10) ? ` <span style="font-size:11px">⏰~${Math.max(1,x.predict.etaMin)}'</span>` : '';
    return `<div style="background:var(--s1);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
      <div style="font-size:11px;color:var(--muted)">${x.label}</div>
      <div style="font-size:20px;font-weight:800;color:${col}">${x.value<0?'—':x.value}${x.unit}${eta}</div>
      <div style="height:6px;background:var(--border);border-radius:4px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${col};transition:width .5s"></div></div>
      <div style="font-size:10px;color:var(--muted);margin-top:3px">cảnh báo ${x.warn}${x.unit} · nguy hiểm ${x.crit}${x.unit}</div>
    </div>`;
  }).join('');

  const ft = document.getElementById('monFoot');
  if (ft) ft.textContent = `Uptime: ${fmtUptime(m.uptime)} · RAM tiến trình: ${m.memProcessMB}MB · ${m.cores} nhân CPU · cập nhật ${new Date(m.sampledAt).toLocaleTimeString('vi-VN')}`;

  // Cảnh báo nổi khi vừa chuyển sang nguy hiểm / dự báo rủi ro
  if ((m.overall==='critical' || m.overall==='predict') && m.overall !== _lastMonOverall && m.alerts && m.alerts.length) {
    toast(m.alerts[0].msg, 'err');
  }
  _lastMonOverall = m.overall;
}
// Tự đọc lại mỗi 10s khi đang ở trang Super Admin
setInterval(() => {
  const ov = document.getElementById('superOv');
  if (superToken && ov && ov.classList.contains('on')) loadMonitor();
}, 10000);

let superPlans = [];
async function loadSuperPlans() {
  const el = document.getElementById('superPlansBody');
  if (!el) return;
  try {
    superPlans = await superApi('GET','/api/super/plans');
    const cell = (i,k,v,w) => `<td style="padding:5px"><input data-i="${i}" data-k="${k}" value="${v}" style="width:${w}px;padding:5px 7px;font-size:12px"/></td>`;
    el.innerHTML = `
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase">
          <th style="padding:5px">Gói</th><th>Giá VND</th><th>Giá USD</th><th>Khách</th><th>Sản phẩm</th><th>Rules</th><th>Giảm %</th>
        </tr></thead>
        <tbody>${superPlans.map((p,i)=>`<tr style="border-top:1px solid var(--border)">
          <td style="padding:5px;font-weight:700;font-size:12px">${sanitizeHTML(p.label)}<div style="font-size:9px;color:var(--muted);font-family:monospace">${p.id}</div></td>
          ${cell(i,'price',p.price,95)}${cell(i,'price_usd',p.price_usd,60)}
          ${cell(i,'customers',p.customers,60)}${cell(i,'products',p.products,60)}${cell(i,'rules',p.rules,60)}
          ${cell(i,'discount_pct',p.discount_pct,50)}
        </tr>`).join('')}</tbody>
      </table>
      <div style="font-size:11px;color:var(--muted);margin-top:8px">−1 = không giới hạn. Giảm % &gt; 0 sẽ hiện giá gạch ngang cho khách.</div>`;
  } catch(e) { el.innerHTML = `<div class="empty" style="padding:12px">❌ ${e.message}</div>`; }
}
async function saveSuperPlans() {
  document.querySelectorAll('#superPlansBody input[data-i]').forEach(inp => {
    superPlans[+inp.dataset.i][inp.dataset.k] = inp.value;
  });
  try {
    await superApi('PUT','/api/super/plans',{ plans: superPlans });
    toast('✅ Đã lưu gói & giá — áp dụng ngay');
    loadSuperPlans();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function loadSuperOrders() {
  const tb = document.getElementById('superOrdersTb');
  if (!tb) return;
  try {
    const orders = await superApi('GET','/api/super/orders?status=pending');
    tb.innerHTML = orders.length
      ? orders.map(o => `<tr>
          <td style="padding:10px 20px;font-family:monospace;font-size:11px;color:var(--cyan)">${o.payment_ref}</td>
          <td style="font-size:12px">${o.shop_name||o.shop_id}<div style="font-size:9px;color:var(--muted);font-family:monospace">${o.shop_id}</div></td>
          <td>${PLAN_LABELS[o.plan]?.icon||''} ${PLAN_LABELS[o.plan]?.name||o.plan}</td>
          <td style="font-weight:700">${fmoney(o.amount)}</td>
          <td style="font-size:11px;color:var(--muted)">${fd(o.created_at)}</td>
          <td><div style="display:flex;gap:5px">
            <button class="btn btn-green" style="padding:3px 9px;font-size:10px" onclick="superApproveOrder('${o.payment_ref}')">✅ Duyệt</button>
            <button class="btn btn-red" style="padding:3px 9px;font-size:10px" onclick="superRejectOrder('${o.payment_ref}')">✕ Từ chối</button>
          </div></td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="empty" style="padding:16px">Không có đơn nào đang chờ duyệt 🎉</td></tr>';
  } catch(e) { tb.innerHTML = `<tr><td colspan="6" class="empty" style="padding:16px">❌ ${e.message}</td></tr>`; }
}

async function superApproveOrder(ref) {
  if (!confirm(`Xác nhận ĐÃ NHẬN tiền và duyệt đơn ${ref}?`)) return;
  try {
    await superApi('POST',`/api/super/orders/${ref}/approve`);
    toast('✅ Đã duyệt đơn — shop đã được lên gói');
    loadSuperDashboard();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function superRejectOrder(ref) {
  if (!confirm(`Từ chối / huỷ đơn ${ref}?`)) return;
  try {
    await superApi('POST',`/api/super/orders/${ref}/reject`);
    toast('Đã huỷ đơn');
    loadSuperOrders();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function savePlatformContact() {
  const email = document.getElementById('spContactEmail')?.value.trim();
  const phone = document.getElementById('spContactPhone')?.value.trim();
  const note  = document.getElementById('spContactNote')?.value.trim();
  const telegram = document.getElementById('spContactTelegram')?.value.trim();
  const whatsapp = document.getElementById('spContactWhatsapp')?.value.trim();
  try {
    await superApi('PUT','/api/super/platform-contact',{ email, phone, note, telegram, whatsapp });
    toast('✅ Đã lưu thông tin liên hệ hỗ trợ');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function savePlatformPayments() {
  const stripe = document.getElementById('spPayStripe')?.value.trim();
  const paypal = document.getElementById('spPayPaypal')?.value.trim();
  const wise   = document.getElementById('spPayWise')?.value.trim();
  const visa   = document.getElementById('spPayVisa')?.value.trim();
  try {
    await superApi('PUT','/api/super/payment-methods',{ stripe, paypal, wise, visa });
    toast('✅ Đã lưu phương thức thanh toán quốc tế');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function saveStripeConfig() {
  const secret_key     = document.getElementById('spStripeSecret')?.value.trim();
  const webhook_secret = document.getElementById('spStripeWebhook')?.value.trim();
  try {
    await superApi('PUT','/api/super/stripe-config',{ secret_key, webhook_secret });
    toast('✅ Đã lưu cấu hình Stripe');
    loadSuperDashboard();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function saveCopilotConfig() {
  const provider = document.getElementById('spCopilotProvider')?.value;
  const model    = document.getElementById('spCopilotModel')?.value.trim();
  const api_key  = document.getElementById('spCopilotKey')?.value.trim();
  try {
    await superApi('PUT','/api/super/copilot-config',{ provider, model, api_key });
    toast('✅ Đã lưu Trợ lý AI hướng dẫn');
    loadSuperDashboard();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function savePlatformBank() {
  const bank_code    = document.getElementById('spBankCode')?.value;
  const bank_account = document.getElementById('spBankAccount')?.value.trim();
  const bank_holder  = document.getElementById('spBankHolder')?.value.trim();
  if (!bank_account || !bank_holder) { toast('Điền đầy đủ số TK và tên chủ TK','err'); return; }
  try {
    await superApi('PUT','/api/super/bank-config',{ bank_code, bank_account, bank_holder });
    toast('✅ Đã lưu thông tin ngân hàng platform');
  } catch(e) { toast('❌ '+e.message,'err'); }
}

function openCreateShopModal() {
  document.getElementById('createShopMod').classList.add('on');
}

async function createShopForCustomer() {
  const shopName = document.getElementById('csName').value.trim();
  const adminUser = document.getElementById('csUser').value.trim();
  const adminPass = document.getElementById('csPass').value;
  const plan      = document.getElementById('csPlan').value;
  if (!shopName || !adminUser || !adminPass) { toast('Điền đầy đủ thông tin','err'); return; }
  try {
    const r = await superApi('POST','/api/super/shops',{ shopName, adminUser, adminPass, plan });
    toast(`✅ Đã tạo shop: ${r.shopId}`);
    document.getElementById('createShopMod').classList.remove('on');
    ['csName','csUser','csPass'].forEach(i=>document.getElementById(i).value='');
    loadSuperDashboard();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function impersonateShop(shopId, shopName) {
  if (!confirm(`Đăng nhập vào shop "${shopName}"?`)) return;
  try {
    const r = await superApi('POST',`/api/super/impersonate/${shopId}`);
    // Đăng nhập thay shop
    token    = r.token;
    shopInfo = r.shop;
    localStorage.setItem('sk_token', token);
    localStorage.setItem('sk_shop',  JSON.stringify(r.shop));
    document.getElementById('superOv').classList.remove('on');
    document.getElementById('loginOv').style.display = 'none';
    document.getElementById('shopLabel').textContent        = r.shop.name;
    
    
    updateWebhookUrls(r.shop.api_key);
    initSocket(r.shop.id);
    await init();
    toast(`✅ Đang xem shop: ${shopName}`);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

async function deleteShop(id, name) {
  if (!confirm(`Xóa vĩnh viễn shop "${name}"?\nTất cả dữ liệu (khách hàng, tin nhắn, đơn hàng) sẽ bị mất!`)) return;
  try {
    await superApi('DELETE',`/api/super/shops/${id}`);
    toast(`🗑️ Đã xóa shop ${name}`);
    loadSuperDashboard();
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// Admin cấp mật khẩu portal cho khách hàng (vẫn dùng được từ trang Khách hàng)
async function setPortalPassword(id, name) {
  const pw = prompt(`Đặt mật khẩu portal cho "${name}":\n(Khách hàng dùng SĐT + mật khẩu này để đăng nhập)`);
  if (!pw) return;
  if (pw.length < 4) { toast('Mật khẩu phải từ 4 ký tự','err'); return; }
  try {
    await api('PUT', `/api/customers/${id}/portal-password`, { password: pw });
    toast(`✅ Đã cấp mật khẩu portal cho ${name}`);
  } catch(e) { toast('❌ '+e.message,'err'); }
}

// Restore super admin session on page load
window.addEventListener('load', () => {
  // Xóa stale portal keys cũ nếu còn
  localStorage.removeItem('sk_portal_token');
  localStorage.removeItem('sk_portal_cust');
  // Restore super admin
  if (superToken) {
    try {
      const payload = JSON.parse(atob(superToken.split('.')[1]));
      if (payload.role === 'superadmin' && payload.exp * 1000 > Date.now()) {
        document.getElementById('loginOv').style.display = 'none';
        document.getElementById('superOv').classList.add('on');
        loadSuperDashboard();
      } else { localStorage.removeItem('sk_super_token'); superToken = null; }
    } catch { localStorage.removeItem('sk_super_token'); superToken = null; }
  }
  // Xử lý ?register=true từ landing page
  if (new URLSearchParams(location.search).get('register') === 'true') {
    switchLoginTab('shop'); showRegister(true);
  }
}, { once: true });

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Escape: đóng tất cả modal
  if (e.key === 'Escape') { closeMod(); closeProdMod(); closeTL(); closeQR(); closeSidebar(); }

  // Ctrl/Cmd + K: focus ô tìm kiếm khách hàng
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    go('customers');
    setTimeout(() => { const el = document.getElementById('custSearch'); if (el) el.focus(); }, 100);
  }

  // Ctrl/Cmd + D: về Dashboard
  if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.shiftKey) {
    e.preventDefault(); go('dashboard');
  }

  // Ctrl/Cmd + I: mở Inbox
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault(); go('inbox');
  }

  // Ctrl/Cmd + N: thêm khách hàng mới
  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
    const active = document.querySelector('.page.on');
    if (active?.id === 'page-customers') { e.preventDefault(); go('addcust'); }
  }
});

// ── SCROLL TO TOP khi chuyển trang ───────────────────────────────────
const _origGo = window.go;
// (go() đã được khai báo trước — wrap lại để auto scroll)
const _goPatched = go;
window.go = function(id) {
  _goPatched(id);
  const mainEl = document.querySelector('.main');
  if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
};
