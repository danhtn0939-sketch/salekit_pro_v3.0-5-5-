/**
 * copilot.js — Trợ lý AI hướng dẫn sử dụng (context-aware).
 *
 * Luồng:  Frontend gửi { page, message }
 *      → chọn đúng file guides/<...>.md theo trang
 *      → nạp vào System Prompt
 *      → gọi LLM (key của CHỦ APP, cấu hình ở Super Admin)
 *      → trả lời từng bước, tiếng Việt, thân thiện.
 */

const fs   = require('fs');
const path = require('path');
const { all, one, q } = require('../../db');
const { copilotReply, modelForProvider, detectProvider } = require('../../ai');

const FREE_LIMIT = 7; // số lượt hỏi miễn phí cho gói Free

// Mô tả các "công cụ" AI được phép đề xuất (làm hộ trong app). AI KHÔNG tự thực thi —
// chỉ đề xuất; backend chỉ chạy sau khi người dùng bấm xác nhận.
const TOOLS_PROMPT = `

=== KHẢ NĂNG LÀM HỘ (ACTIONS) ===
Khi người dùng YÊU CẦU bạn LÀM GIÚP một việc trong app (không chỉ hỏi cách làm), hãy:
1) Viết 1-2 câu xác nhận ngắn bằng tiếng Việt.
2) Rồi thêm DUY NHẤT MỘT khối hành động ở CUỐI, đúng định dạng (mở bằng ba dấu huyền + chữ action):
\`\`\`action
{"tool":"<tên>","args":{...},"summary":"<mô tả ngắn để người dùng xác nhận>"}
\`\`\`
Chỉ 1 khối action mỗi lần. Nếu người dùng chỉ HỎI cách làm → trả lời hướng dẫn, TUYỆT ĐỐI không thêm khối action.

Danh sách tool hợp lệ:
- create_products → args: { "items":[{"name":"...","price":"199.000","descr":"...","emoji":"📦"}] }
- create_rule     → args: { "keyword":"giá|bao nhiêu", "reply":"..." }   (từ khóa cách nhau bằng | )
- set_bot         → args: { "name":"...", "welcome":"...", "color":"#7c3aed" }  (mọi field tuỳ chọn)
- set_ai          → args: { "api_key":"AIza... hoặc sk-...", "enabled":true }   (tự nhận diện nhà cung cấp)
- set_channel     → args: { "channel":"facebook|zalo|telegram|whatsapp", "page_token":"...", "verify_token":"..." }

Quy tắc: giá để dạng chuỗi (vd "150.000"). Nếu thiếu thông tin để làm, hãy HỎI LẠI cho đủ rồi mới đề xuất action.`;

const GUIDES_DIR = path.join(__dirname, '..', '..', 'guides');

// Bản đồ TRANG → FILE hướng dẫn
const PAGE_GUIDE = {
  channels:  'channels_guide.md',
  embed:     'embed_guide.md',
  aiconfig:  'aiconfig_guide.md',
  botconfig: 'bot_guide.md',
  autorules: 'bot_guide.md',
  products:  'products_guide.md',
  kanban:    'crm_guide.md',
  customers: 'crm_guide.md',
  addcust:   'crm_guide.md',
  leads:     'crm_guide.md',
  inbox:     'inbox_guide.md',
  billing:   'billing_guide.md',
};

function loadGuide(page) {
  const file = PAGE_GUIDE[page] || 'default_guide.md';
  try { return fs.readFileSync(path.join(GUIDES_DIR, file), 'utf8'); }
  catch {
    try { return fs.readFileSync(path.join(GUIDES_DIR, 'default_guide.md'), 'utf8'); }
    catch { return ''; }
  }
}

async function getCopilotConfig() {
  const rows = await all(
    "SELECT key,value FROM platform_config WHERE key IN ('copilot_provider','copilot_api_key','copilot_model')"
  );
  const cfg = Object.fromEntries(rows.map(r => [r.key, r.value]));
  const provider = cfg.copilot_provider || 'openai';
  return {
    provider,
    apiKey: cfg.copilot_api_key || process.env.COPILOT_API_KEY || process.env.OPENAI_API_KEY || '',
    // tự nâng cấp model cũ (vd gemini-1.5 đã ngừng) sang model hợp lệ
    model: modelForProvider(provider, cfg.copilot_model),
  };
}

module.exports = function register(app, { auth }) {
  app.post('/api/copilot', auth, async (req, res) => {
    try {
      const page    = (req.body.page || 'dashboard').toString().slice(0, 40);
      const message = (req.body.message || '').toString().slice(0, 1000);
      if (!message.trim()) return res.status(400).json({ error: 'Thiếu câu hỏi' });

      const { provider, apiKey, model } = await getCopilotConfig();
      if (!apiKey) {
        return res.json({
          configured: false,
          reply: '⚠️ Trợ lý AI chưa được chủ ứng dụng bật. Vui lòng liên hệ bộ phận hỗ trợ để được kích hoạt.',
        });
      }

      // ── Giới hạn 7 lượt miễn phí cho gói Free (gói trả phí: không giới hạn) ──
      const shop   = await one('SELECT plan, copilot_used FROM shops WHERE id=$1', [req.shopId]);
      const isPaid = shop && shop.plan && shop.plan !== 'free';
      const used   = +(shop?.copilot_used || 0);
      if (!isPaid && used >= FREE_LIMIT) {
        return res.json({
          configured: true,
          limit_reached: true,
          used, limit: FREE_LIMIT, remaining: 0,
          reply: `🔒 Bạn đã dùng hết **${FREE_LIMIT} lượt hỏi miễn phí** của Trợ lý AI.\n\nNâng cấp gói (chỉ từ **$10–$15/tháng**) để hỏi **không giới hạn** và mở khoá toàn bộ tính năng.`,
        });
      }

      const guide  = loadGuide(page);
      const system = `Bạn là "Trợ lý SalesKit" — hướng dẫn chủ shop sử dụng phần mềm, bằng TIẾNG VIỆT, thân thiện, NGẮN GỌN và theo TỪNG BƯỚC ĐÁNH SỐ.
Người dùng thường KHÔNG rành công nghệ: tránh thuật ngữ khó; nếu buộc phải dùng (vd "webhook", "token") hãy giải thích bằng 1 câu đơn giản.
Chỉ trả lời trong phạm vi tính năng của phần mềm SalesKit Pro. Nếu hỏi ngoài phạm vi, lịch sự từ chối và gợi ý hỏi về phần mềm.
Người dùng đang ở trang: "${page}".

=== TÀI LIỆU HƯỚNG DẪN LIÊN QUAN ===
${guide}
=== HẾT TÀI LIỆU ===

Dựa CHÍNH vào tài liệu trên để trả lời. Trình bày dễ đọc: dùng bước 1, 2, 3...; in đậm chỗ quan trọng bằng **...**. Nếu thiếu thông tin, khuyên người dùng liên hệ hỗ trợ.${TOOLS_PROMPT}`;

      const reply = await copilotReply({ provider, apiKey, model, system, message });

      // Tính lượt cho gói Free (chỉ trừ khi trả lời thành công)
      let newUsed = used;
      if (!isPaid) {
        newUsed = used + 1;
        await q('UPDATE shops SET copilot_used=$1 WHERE id=$2', [newUsed, req.shopId]);
      }
      res.json({
        configured: true,
        reply: reply || 'Xin lỗi, mình chưa trả lời được. Bạn thử hỏi lại nhé.',
        used: isPaid ? null : newUsed,
        limit: isPaid ? null : FREE_LIMIT,
        remaining: isPaid ? null : Math.max(0, FREE_LIMIT - newUsed),
      });
    } catch (e) {
      console.error('[Copilot]', e.message);
      res.status(500).json({ error: 'Trợ lý gặp sự cố, vui lòng thử lại.' });
    }
  });

  // ── THỰC THI HÀNH ĐỘNG (sau khi người dùng XÁC NHẬN) ──────────────────
  app.post('/api/copilot/execute', auth, async (req, res) => {
    try {
      const { tool, args } = req.body || {};
      const a = args || {};
      const sid = req.shopId;

      if (tool === 'create_products') {
        const items = Array.isArray(a.items) ? a.items.slice(0, 20) : [];
        if (!items.length) return res.status(400).json({ error: 'Không có sản phẩm nào' });
        let n = 0;
        for (const it of items) {
          if (!it || !it.name) continue;
          await q(
            `INSERT INTO products (shop_id,name,price,emoji,descr,tags,badge)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [sid, String(it.name).slice(0,120), String(it.price||'').slice(0,40),
             it.emoji || '📦', String(it.descr||'').slice(0,500), JSON.stringify(it.tags||[]), it.badge||'']
          );
          n++;
        }
        return res.json({ ok: true, message: `Đã tạo ${n} sản phẩm.` });
      }

      if (tool === 'create_rule') {
        if (!a.keyword || !a.reply) return res.status(400).json({ error: 'Thiếu từ khóa hoặc câu trả lời' });
        await q('INSERT INTO rules (shop_id,keyword,reply,active) VALUES ($1,$2,$3,TRUE)',
          [sid, String(a.keyword).slice(0,200), String(a.reply).slice(0,1000)]);
        return res.json({ ok: true, message: 'Đã tạo câu trả lời tự động.' });
      }

      if (tool === 'set_bot') {
        await q(
          `INSERT INTO bot_config (shop_id,name,welcome,color)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT(shop_id) DO UPDATE SET
             name=COALESCE($2,bot_config.name),
             welcome=COALESCE($3,bot_config.welcome),
             color=COALESCE($4,bot_config.color)`,
          [sid, a.name || null, a.welcome || null, a.color || null]
        );
        return res.json({ ok: true, message: 'Đã cập nhật cấu hình bot.' });
      }

      if (tool === 'set_ai') {
        if (!a.api_key) return res.status(400).json({ error: 'Thiếu API key' });
        const provider = detectProvider(a.api_key) || a.provider || 'openai';
        const model    = modelForProvider(provider, a.model);
        const enabled  = a.enabled !== false;
        await q(
          `INSERT INTO ai_config (shop_id,provider,api_key,model,enabled)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT(shop_id) DO UPDATE SET
             provider=EXCLUDED.provider, api_key=EXCLUDED.api_key,
             model=EXCLUDED.model, enabled=EXCLUDED.enabled`,
          [sid, provider, a.api_key, model, enabled]
        );
        return res.json({ ok: true, message: `Đã ${enabled?'bật':'lưu'} AI (${provider}).` });
      }

      if (tool === 'set_channel') {
        const ch = a.channel;
        if (!['facebook','zalo','telegram','whatsapp'].includes(ch))
          return res.status(400).json({ error: 'Kênh không hợp lệ' });
        if (!a.page_token) return res.status(400).json({ error: 'Thiếu token' });
        await q(
          `INSERT INTO channel_tokens (shop_id,channel,page_token,verify_token)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT(shop_id,channel) DO UPDATE SET
             page_token=EXCLUDED.page_token, verify_token=EXCLUDED.verify_token`,
          [sid, ch, a.page_token, a.verify_token || null]
        );
        return res.json({ ok: true, message: `Đã lưu token kênh ${ch}.` });
      }

      return res.status(400).json({ error: 'Hành động không hợp lệ' });
    } catch (e) {
      console.error('[Copilot execute]', e.message);
      res.status(500).json({ error: 'Không thực hiện được: ' + e.message });
    }
  });
};
