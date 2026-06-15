/*!
 * SalesKit Widget v2.0 — CONNECTED (kết nối backend)
 *
 * Khác bản standalone: widget này tải config + xử lý reply TỪ BACKEND,
 * nên data luôn đồng bộ với dashboard, không cần sửa code khi đổi sản phẩm.
 *
 * Cách nhúng (chỉ 1 dòng, thay :apiKey bằng key của shop):
 *   <script src="https://your-backend.com/widget/sk_xxxxx/config.js"></script>
 *   <script src="https://your-backend.com/saleskit-widget-connected.js"></script>
 *
 * config.js sẽ set window.SALESKIT_CONFIG, file này đọc nó để render.
 */
(function(){
'use strict';

function boot(){
  var C = window.SALESKIT_CONFIG;
  if(!C){
    console.error('[SalesKit] Chưa load config.js trước widget. Kiểm tra lại thứ tự 2 thẻ script.');
    return;
  }

  // Tự suy ra base URL của backend từ src của chính script này (nếu cùng host)
  var BASE = (C.backendBase || '').replace(/\/$/,'');
  var REPLY_URL = BASE + (C.replyEndpoint || ('/widget/' + C.apiKey + '/reply'));

  var color = C.color || '#7c3aed';
  var isDark = C.theme === 'dark';
  var bg = isDark ? '#1a1a2e' : '#fff';
  var bgB = isDark ? '#2a2a3e' : '#f0f0f8';
  var tc = isDark ? '#e0e0f0' : '#1a1a2e';
  var pos = C.position === 'left' ? 'left:24px' : 'right:24px';
  var posBox = C.position === 'left' ? 'left:16px' : 'right:16px';

  var css = '#skw-btn{position:fixed;'+pos+';bottom:24px;width:56px;height:56px;border-radius:50%;background:'+color+';border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:24px;z-index:999999;transition:transform .2s}'
  +'#skw-btn:hover{transform:scale(1.1)}'
  +'#skw-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#ef4444;border-radius:50%;border:2px solid #fff;display:none;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700}'
  +'#skw-box{position:fixed;'+posBox+';bottom:90px;width:360px;max-height:520px;background:'+bg+';border-radius:18px;box-shadow:0 8px 40px rgba(0,0,0,.2);display:none;flex-direction:column;z-index:999998;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;border:1px solid rgba(0,0,0,.08)}'
  +'#skw-head{background:'+color+';padding:14px 16px;display:flex;align-items:center;gap:10px}'
  +'#skw-head-av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px}'
  +'#skw-head-name{font-weight:700;font-size:15px;color:#fff}#skw-head-status{font-size:11px;color:rgba(255,255,255,.85)}'
  +'#skw-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;opacity:.8;margin-left:auto}'
  +'#skw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:0}'
  +'.skw-msg{max-width:78%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;word-break:break-word}'
  +'.skw-bot{align-self:flex-start;background:'+bgB+';color:'+tc+';border-bottom-left-radius:4px}'
  +'.skw-usr{align-self:flex-end;background:'+color+';color:#fff;border-bottom-right-radius:4px}'
  +'.skw-typing{align-self:flex-start;background:'+bgB+';padding:10px 16px;border-radius:14px}'
  +'.skw-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:'+color+';margin:0 2px;animation:skwB 1.2s infinite}'
  +'.skw-dot:nth-child(2){animation-delay:.2s}.skw-dot:nth-child(3){animation-delay:.4s}'
  +'@keyframes skwB{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}'
  +'#skw-quick{padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid rgba(0,0,0,.06)}'
  +'.skw-qbtn{background:none;border:1px solid '+color+';color:'+color+';padding:5px 10px;border-radius:20px;font-size:12px;cursor:pointer;font-family:inherit}'
  +'.skw-qbtn:hover{background:'+color+';color:#fff}'
  +'#skw-inp-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.06)}'
  +'#skw-inp{flex:1;border:1px solid rgba(0,0,0,.12);background:'+(isDark?'#2a2a3e':'#f7f7fb')+';color:'+tc+';border-radius:22px;padding:9px 14px;font-size:13px;outline:none;font-family:inherit}'
  +'#skw-send{background:'+color+';border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;color:#fff;font-size:14px}'
  +'.skw-prods{align-self:stretch;display:flex;flex-direction:column;gap:8px}'
  +'.skw-pcard{display:flex;gap:10px;align-items:center;background:'+bgB+';border-radius:12px;padding:8px}'
  +'.skw-pimg{width:56px;height:56px;border-radius:9px;object-fit:cover;flex-shrink:0;background:'+(isDark?'#3a3a4e':'#e8e8f4')+';display:flex;align-items:center;justify-content:center;font-size:28px}'
  +'.skw-pname{font-weight:600;font-size:13px;color:'+tc+'}'
  +'.skw-pprice{color:'+color+';font-weight:700;font-size:13px}'
  +'.skw-pdesc{font-size:11px;color:'+(isDark?'#9a9ab0':'#888')+';line-height:1.4}'
  +'.skw-pbuy{margin-top:6px;background:'+color+';color:#fff;border:none;border-radius:16px;padding:4px 12px;font-size:11px;cursor:pointer;font-family:inherit}'
  +'@media(max-width:400px){#skw-box{width:calc(100vw - 32px)}}';

  var root = document.createElement('div');
  root.innerHTML = '<style>'+css+'</style>'
  +'<button id="skw-btn"><span id="skw-badge"></span>'+(C.avatar||'🤖')+'</button>'
  +'<div id="skw-box"><div id="skw-head"><div id="skw-head-av">'+(C.avatar||'🤖')+'</div>'
  +'<div><div id="skw-head-name">'+(C.name||'Tư vấn')+'</div><div id="skw-head-status">🟢 Online</div></div>'
  +'<button id="skw-close">✕</button></div>'
  +'<div id="skw-msgs"></div><div id="skw-quick"></div>'
  +'<div id="skw-inp-row"><input id="skw-inp" placeholder="Nhập tin nhắn..."><button id="skw-send">➤</button></div></div>';
  document.body.appendChild(root);

  var btn = root.querySelector('#skw-btn');
  var box = root.querySelector('#skw-box');
  var msgs = root.querySelector('#skw-msgs');
  var inp = root.querySelector('#skw-inp');
  var badge = root.querySelector('#skw-badge');
  var quick = root.querySelector('#skw-quick');
  var opened = false, greeted = false;

  // Nút xem sản phẩm (kèm ảnh) — luôn hiện đầu tiên nếu shop có sản phẩm
  if ((C.products||[]).length){
    var pbtn = document.createElement('button');
    pbtn.className = 'skw-qbtn'; pbtn.textContent = '🛍️ Sản phẩm';
    pbtn.onclick = function(){ showProducts(); };
    quick.appendChild(pbtn);
  }
  (C.quickBtns||[]).forEach(function(t){
    var b = document.createElement('button');
    b.className = 'skw-qbtn'; b.textContent = t;
    b.onclick = function(){ sendMsg(t); };
    quick.appendChild(b);
  });

  btn.onclick = function(){
    opened = !opened;
    box.style.display = opened ? 'flex' : 'none';
    badge.style.display = 'none';
    if(opened && !greeted){ greeted = true; setTimeout(function(){ addBot(C.welcome||'Xin chào! 👋'); }, 300); }
    if(opened) inp.focus();
  };
  root.querySelector('#skw-close').onclick = function(){ opened=false; box.style.display='none'; };
  root.querySelector('#skw-send').onclick = function(){ sendMsg(); };
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter') sendMsg(); });
  setTimeout(function(){ if(!opened){ badge.style.display='flex'; badge.textContent='1'; } }, 5000);

  function sendMsg(text){
    text = (text || inp.value).trim();
    if(!text) return;
    inp.value = '';
    addUser(text);
    var typing = addTyping();
    // Gọi backend để lấy reply (data luôn mới nhất từ dashboard)
    fetch(REPLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ text: text, channel: 'web' })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){ typing.remove(); addBot(d.reply || '...'); if(d.products&&d.products.length) showProducts(d.products); })
    .catch(function(){ typing.remove(); addBot(localReply(text)); }); // fallback offline
  }

  // Fallback nếu backend lỗi — xử lý local bằng rules trong config
  function localReply(text){
    var t = text.toLowerCase();
    for(var i=0;i<(C.rules||[]).length;i++){
      var r = C.rules[i];
      if(r.trigger.split('|').some(function(k){ return t.indexOf(k.trim().toLowerCase())>=0; })){
        var rep = r.reply;
        if(C.products && C.products.length){
          rep = rep.replace(/{tên_sp}/g, C.products[0].name||'').replace(/{giá_sp}/g, C.products[0].price||'');
        }
        return rep;
      }
    }
    return 'Cảm ơn bạn! Mình sẽ tư vấn ngay 😊';
  }

  // Thư viện sản phẩm có ẢNH thật (khách bấm "🛍️ Sản phẩm")
  function esc(s){ var d=document.createElement('div'); d.textContent=(s==null?'':String(s)); return d.innerHTML; }
  function showProducts(list){
    var ps = list || C.products || [];
    if(!opened){ box.style.display='flex'; opened=true; }
    if(!ps.length){ addBot('Shop chưa cập nhật sản phẩm 😅'); return; }
    var wrap = document.createElement('div'); wrap.className='skw-prods';
    ps.slice(0,10).forEach(function(p){
      var media = p.image
        ? '<img class="skw-pimg" src="'+(String(p.image).charAt(0)==='/'?BASE+p.image:p.image)+'" alt="">'
        : '<div class="skw-pimg">'+esc(p.emoji||'📦')+'</div>';
      var card = document.createElement('div'); card.className='skw-pcard';
      var info = document.createElement('div'); info.style.flex='1';
      info.innerHTML = '<div class="skw-pname">'+esc(p.name)+'</div>'
        +'<div class="skw-pprice">'+esc(p.price||'')+'đ</div>'
        +(p.desc?'<div class="skw-pdesc">'+esc(p.desc)+'</div>':'');
      var buy = document.createElement('button'); buy.className='skw-pbuy'; buy.textContent='🛒 Đặt';
      buy.onclick = function(){ sendMsg('Mình muốn đặt: '+p.name); };
      info.appendChild(buy);
      card.innerHTML = media; card.appendChild(info);
      wrap.appendChild(card);
    });
    msgs.appendChild(wrap); msgs.scrollTop=msgs.scrollHeight;
  }
  function addBot(t){ var d=document.createElement('div'); d.className='skw-msg skw-bot'; d.innerHTML=String(t).replace(/\n/g,'<br>'); msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; }
  function addUser(t){ var d=document.createElement('div'); d.className='skw-msg skw-usr'; d.textContent=t; msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; }
  function addTyping(){ var d=document.createElement('div'); d.className='skw-typing'; d.innerHTML='<span class="skw-dot"></span><span class="skw-dot"></span><span class="skw-dot"></span>'; msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; return d; }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
