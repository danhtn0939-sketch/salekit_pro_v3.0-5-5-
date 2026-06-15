const { q, one, all } = require('./db');
const { analyzeSentiment } = require('./ai');
const { verifyWebhook } = require('./src/signatures');   // Fix #1 — xác thực chữ ký webhook
const BROWSE_RE = /sản phẩm|xem hàng|có gì|mẫu nào|danh sách|menu|các mẫu/i;

function registerWebhooks(app, helpers) {
  const { generateReply, shopByApiKey, emit } = helpers;
  const _emit = emit || (() => {});

  // ── FACEBOOK verify ──────────────────────────────────────────────
  app.get('/webhook/:apiKey/facebook', async (req, res) => {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop) return res.sendStatus(404);
    const tok = await one(
      "SELECT * FROM channel_tokens WHERE shop_id=$1 AND channel='facebook'",
      [shop.id]
    );
    const verifyToken = tok?.verify_token || 'my_verify_token';
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === verifyToken)
      return res.status(200).send(req.query['hub.challenge']);
    res.sendStatus(403);
  });

  // ── FACEBOOK receive ─────────────────────────────────────────────
  app.post('/webhook/:apiKey/facebook', async (req, res) => {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop || req.body.object !== 'page') return res.sendStatus(404);
    const tok = await one("SELECT * FROM channel_tokens WHERE shop_id=$1 AND channel='facebook'", [shop.id]);
    if (!verifyWebhook('facebook', tok, req, shop.id)) return res.sendStatus(403); // Fix #1
    res.sendStatus(200);
    const base = `${req.protocol}://${req.get('host')}`;

    (async () => {
      try {
        const pageToken = tok?.page_token;
        for (const entry of req.body.entry || []) {
          // 1) TIN NHẮN Messenger
          for (const ev of entry.messaging || []) {
            if (!ev.message?.text || ev.message.is_echo) continue;
            const msgText   = ev.message.text;
            const senderId  = ev.sender.id;
            const sentiment = analyzeSentiment(msgText);
            const { reply, aiGenerated } = await generateReply(shop.id, msgText);
            await q('INSERT INTO messages (shop_id,channel,direction,text,sentiment,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
              [shop.id, 'facebook', 'in', msgText, sentiment, senderId]);
            await q('INSERT INTO messages (shop_id,channel,direction,text,ai_reply,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
              [shop.id, 'facebook', 'out', reply, aiGenerated, senderId]);
            if (pageToken) await sendFB(pageToken, senderId, reply);
            // Thẻ sản phẩm có nút khi khách hỏi xem hàng
            if (pageToken && BROWSE_RE.test(msgText)) {
              const prods = await all('SELECT id,emoji,name,price,descr,image FROM products WHERE shop_id=$1 ORDER BY id DESC LIMIT 8', [shop.id]);
              if (prods.length) await sendFBCard(pageToken, senderId, prods, base);
            }
            _emit(shop.id, 'message:new', { channel: 'facebook', text: msgText, sentiment, reply, sender_id: senderId });
          }
          // 2) BÌNH LUẬN dưới bài (feed/comment) — auto-reply nếu shop bật
          for (const change of entry.changes || []) {
            if (change.field !== 'feed') continue;
            const v = change.value || {};
            if (v.item !== 'comment' || v.verb !== 'add' || !v.message) continue;
            if (v.from && entry.id && String(v.from.id) === String(entry.id)) continue; // bỏ qua cmt của chính page
            if (!tok?.auto_comment) continue;                  // chỉ chạy khi bật
            const { reply, aiGenerated } = await generateReply(shop.id, v.message);
            await q('INSERT INTO messages (shop_id,channel,direction,text,sentiment,sender_id,sender_name) VALUES ($1,$2,$3,$4,$5,$6,$7)',
              [shop.id, 'fb_comment', 'in', v.message, analyzeSentiment(v.message), v.comment_id, v.from?.name || 'FB Comment']);
            await q('INSERT INTO messages (shop_id,channel,direction,text,ai_reply,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
              [shop.id, 'fb_comment', 'out', reply, aiGenerated, v.comment_id]);
            if (pageToken) {
              await sendFBComment(pageToken, v.comment_id, reply);          // rep công khai dưới cmt
              await sendFBPrivateReply(pageToken, v.comment_id, reply);     // + nhắn riêng vào inbox
            }
            _emit(shop.id, 'message:new', { channel: 'fb_comment', text: v.message, reply, sender_id: v.comment_id, sender_name: v.from?.name });
          }
        }
      } catch (e) { console.error('FB webhook error:', e.message); }
    })();
  });

  // ── ZALO receive ─────────────────────────────────────────────────
  app.post('/webhook/:apiKey/zalo', async (req, res) => {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop) return res.sendStatus(404);
    const tok = await one("SELECT * FROM channel_tokens WHERE shop_id=$1 AND channel='zalo'", [shop.id]);
    if (!verifyWebhook('zalo', tok, req, shop.id)) return res.sendStatus(403); // Fix #1
    res.sendStatus(200);

    (async () => {
      try {
        const { event_name, sender, message } = req.body;
        if (event_name === 'user_send_text' && sender?.id && message?.text) {
          const senderId  = sender.id;
          const sentiment = analyzeSentiment(message.text);
          const { reply, aiGenerated } = await generateReply(shop.id, message.text);
          await q('INSERT INTO messages (shop_id,channel,direction,text,sentiment,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
            [shop.id, 'zalo', 'in', message.text, sentiment, senderId]);
          await q('INSERT INTO messages (shop_id,channel,direction,text,ai_reply,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
            [shop.id, 'zalo', 'out', reply, aiGenerated, senderId]);
          if (tok?.page_token) await sendZalo(tok.page_token, senderId, reply);
          _emit(shop.id, 'message:new', { channel: 'zalo', text: message.text, sentiment, reply, sender_id: senderId });
        }
      } catch (e) { console.error('Zalo webhook error:', e.message); }
    })();
  });

  // ── TELEGRAM receive ─────────────────────────────────────────────
  app.post('/webhook/:apiKey/telegram', async (req, res) => {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop) return res.sendStatus(404);
    const tok = await one("SELECT * FROM channel_tokens WHERE shop_id=$1 AND channel='telegram'", [shop.id]);
    if (!verifyWebhook('telegram', tok, req, shop.id)) return res.sendStatus(403); // Fix #1
    res.sendStatus(200);

    (async () => {
      try {
        const msg  = req.body.message || req.body.channel_post;
        if (!msg?.text) return;
        const senderId   = String(msg.chat.id);
        const senderName = msg.from?.first_name || msg.from?.username || 'Telegram User';
        const msgText    = msg.text;
        const sentiment  = analyzeSentiment(msgText);
        const { reply, aiGenerated } = await generateReply(shop.id, msgText);
        await q('INSERT INTO messages (shop_id,channel,direction,text,sentiment,sender_id,sender_name) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [shop.id, 'telegram', 'in', msgText, sentiment, senderId, senderName]);
        await q('INSERT INTO messages (shop_id,channel,direction,text,ai_reply,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
          [shop.id, 'telegram', 'out', reply, aiGenerated, senderId]);
        if (tok?.page_token) await sendTelegram(tok.page_token, senderId, reply);
        _emit(shop.id, 'message:new', { channel: 'telegram', text: msgText, sentiment, reply, sender_id: senderId, sender_name: senderName });
      } catch (e) { console.error('Telegram webhook error:', e.message); }
    })();
  });

  // ── WHATSAPP verify ───────────────────────────────────────────────
  app.get('/webhook/:apiKey/whatsapp', async (req, res) => {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop) return res.sendStatus(404);
    const tok = await one("SELECT * FROM channel_tokens WHERE shop_id=$1 AND channel='whatsapp'", [shop.id]);
    const verifyToken = tok?.verify_token || 'my_whatsapp_verify_token';
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === verifyToken)
      return res.status(200).send(req.query['hub.challenge']);
    res.sendStatus(403);
  });

  // ── WHATSAPP receive ──────────────────────────────────────────────
  app.post('/webhook/:apiKey/whatsapp', async (req, res) => {
    const shop = await shopByApiKey(req.params.apiKey);
    if (!shop || req.body.object !== 'whatsapp_business_account') return res.sendStatus(404);
    const tok = await one("SELECT * FROM channel_tokens WHERE shop_id=$1 AND channel='whatsapp'", [shop.id]);
    if (!verifyWebhook('whatsapp', tok, req, shop.id)) return res.sendStatus(403); // Fix #1
    res.sendStatus(200);

    (async () => {
      try {
        for (const entry of req.body.entry || []) {
          for (const change of entry.changes || []) {
            const value = change.value;
            if (!value?.messages) continue;
            for (const msg of value.messages) {
              if (msg.type !== 'text') continue;
              const senderId      = msg.from;
              const senderName    = value.contacts?.[0]?.profile?.name || senderId;
              const msgText       = msg.text.body;
              const phoneNumberId = value.metadata?.phone_number_id;
              const sentiment     = analyzeSentiment(msgText);
              const { reply, aiGenerated } = await generateReply(shop.id, msgText);
              await q('INSERT INTO messages (shop_id,channel,direction,text,sentiment,sender_id,sender_name) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                [shop.id, 'whatsapp', 'in', msgText, sentiment, senderId, senderName]);
              await q('INSERT INTO messages (shop_id,channel,direction,text,ai_reply,sender_id) VALUES ($1,$2,$3,$4,$5,$6)',
                [shop.id, 'whatsapp', 'out', reply, aiGenerated, senderId]);
              if (tok?.page_token && phoneNumberId)
                await sendWhatsApp(tok.page_token, phoneNumberId, senderId, reply);
              _emit(shop.id, 'message:new', { channel: 'whatsapp', text: msgText, sentiment, reply, sender_id: senderId, sender_name: senderName });
            }
          }
        }
      } catch (e) { console.error('WhatsApp webhook error:', e.message); }
    })();
  });
}

// ── Send helpers (outside registerWebhooks — dùng chung) ─────────────

async function sendFB(pageToken, recipientId, text) {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
    if (!r.ok) console.error('FB send failed:', await r.text());
  } catch (e) { console.error('FB send error:', e.message); }
}

async function sendZalo(oaToken, userId, text) {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch('https://openapi.zalo.me/v2.0/oa/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': oaToken },
      body: JSON.stringify({ recipient: { user_id: userId }, message: { text } }),
    });
    if (!r.ok) console.error('Zalo send failed:', await r.text());
  } catch (e) { console.error('Zalo send error:', e.message); }
}

async function sendTelegram(botToken, chatId, text) {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!r.ok) console.error('Telegram send failed:', await r.text());
  } catch (e) { console.error('Telegram send error:', e.message); }
}

async function sendWhatsApp(accessToken, phoneNumberId, to, text) {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
    });
    if (!r.ok) console.error('WhatsApp send failed:', await r.text());
  } catch (e) { console.error('WhatsApp send error:', e.message); }
}

// Rep công khai dưới 1 bình luận Facebook
async function sendFBComment(pageToken, commentId, text) {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments?access_token=${pageToken}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    if (!r.ok) console.error('FB comment reply failed:', await r.text());
  } catch (e) { console.error('FB comment reply error:', e.message); }
}

// Nhắn riêng vào inbox người vừa comment (private reply)
async function sendFBPrivateReply(pageToken, commentId, text) {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch(`https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${pageToken}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    if (!r.ok) console.error('FB private reply failed:', await r.text());
  } catch (e) { console.error('FB private reply error:', e.message); }
}

// Gửi THẺ SẢN PHẨM có nút (Generic Template carousel) qua Messenger
async function sendFBCard(pageToken, recipientId, products, base) {
  try {
    const { default: fetch } = await import('node-fetch');
    const elements = (products || []).slice(0, 10).map(p => {
      const el = {
        title: (p.name || '').slice(0, 80),
        subtitle: `${p.price || ''}đ${p.descr ? ' · ' + String(p.descr).slice(0, 60) : ''}`,
        buttons: [{ type: 'postback', title: '🛒 Đặt ngay', payload: 'ORDER_' + (p.id || '') }],
      };
      if (p.image) el.image_url = (String(p.image).charAt(0) === '/' ? (base || '') + p.image : p.image);
      return el;
    });
    if (!elements.length) return;
    const r = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${pageToken}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { attachment: { type: 'template', payload: { template_type: 'generic', elements } } },
      }),
    });
    if (!r.ok) console.error('FB card failed:', await r.text());
  } catch (e) { console.error('FB card error:', e.message); }
}

module.exports = { registerWebhooks, sendFB, sendZalo, sendTelegram, sendWhatsApp, sendFBComment, sendFBPrivateReply, sendFBCard };
