<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SalesKit Pro — Dashboard</title>
<script src="/vendor/chart.umd.min.js"></script>
<script>if(typeof Chart==='undefined'){document.write('<scr'+'ipt src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/scr'+'ipt>')}</script>
<script src="/vendor/socket.io.min.js"></script>
<script>if(typeof io==='undefined'){document.write('<scr'+'ipt src="https://cdn.jsdelivr.net/npm/socket.io-client@4.7.5/dist/socket.io.min.js"><\/scr'+'ipt>')}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="/css/app.css">
</head>
<body>

<!-- LOGIN -->
<div class="login-ov" id="loginOv">
  <div class="login-box">
    <div class="login-logo" style="color:var(--text)">Sales<span style="color:var(--cyan)">Kit</span> <span style="color:var(--pink);font-size:14px">PRO</span></div>
    <div class="login-tabs">
      <div class="login-tab on" id="tabShop"  onclick="switchLoginTab('shop')">👤 Khách hàng</div>
      <div class="login-tab"    id="tabSuper" onclick="switchLoginTab('super')">🔧 Quản lý</div>
    </div>

    <!-- Form shop owner (khách hàng dùng tool) -->
    <div id="formShop">
      <div id="formShopLogin">
        <div class="fg" style="margin-bottom:10px"><label>Shop ID</label><input id="lshop" placeholder="my-shop"/></div>
        <div class="fg" style="margin-bottom:10px"><label>Tên đăng nhập</label><input id="lu" placeholder="admin"/></div>
        <div class="fg" style="margin-bottom:14px"><label>Mật khẩu</label><input type="password" id="lp" placeholder="••••••" onkeydown="if(event.key==='Enter')login()"/></div>
        <button class="btn btn-cyan" style="width:100%;justify-content:center;padding:11px;font-size:14px;border-radius:10px" onclick="login()">🔐 Đăng nhập</button>
        <div style="font-size:10px;color:var(--dim);text-align:center;margin-top:10px;font-family:monospace">demo-shop / admin / 1234</div>
        <div class="reg-link" onclick="showRegister(true)">+ Chưa có tài khoản? Đăng ký dùng thử miễn phí</div>
      </div>
      <div id="formShopRegister" style="display:none">
        <div style="font-family:var(--head);font-size:15px;font-weight:700;margin-bottom:16px">🚀 Tạo tài khoản mới</div>
        <div class="fg" style="margin-bottom:10px"><label>Tên shop / doanh nghiệp</label><input id="rName" placeholder="Shop Thời Trang ABC"/></div>
        <div class="fg" style="margin-bottom:10px"><label>Username đăng nhập</label><input id="rUser" placeholder="admin"/></div>
        <div class="fg" style="margin-bottom:14px"><label>Mật khẩu (tối thiểu 6 ký tự)</label><input type="password" id="rPass" placeholder="••••••" onkeydown="if(event.key==='Enter')registerShop()"/></div>
        <button class="btn btn-cyan" style="width:100%;justify-content:center;padding:11px;font-size:14px;border-radius:10px" onclick="registerShop()">🚀 Tạo tài khoản</button>
        <div class="reg-link" style="color:var(--muted)" onclick="showRegister(false)">← Quay lại đăng nhập</div>
      </div>
    </div>

    <!-- Form super admin (quản lý platform) -->
    <div id="formSuper" style="display:none">
      <div style="font-size:12px;color:var(--muted);margin-bottom:16px;text-align:center">Dành cho người quản lý SalesKit Pro platform</div>
      <div class="fg" style="margin-bottom:10px"><label>Username</label><input id="sUser" placeholder="platform_admin"/></div>
      <div class="fg" style="margin-bottom:14px"><label>Mật khẩu</label><input type="password" id="sPass" placeholder="••••••" onkeydown="if(event.key==='Enter')loginSuper()"/></div>
      <button class="btn btn-purple" style="width:100%;justify-content:center;padding:11px;font-size:14px;border-radius:10px" onclick="loginSuper()">🔧 Đăng nhập Quản lý</button>
    </div>
  </div>
</div>

<!-- SUPER ADMIN PANEL -->
<div class="super-ov" id="superOv">
  <div class="super-topbar">
    <div style="display:flex;align-items:center;gap:16px">
      <div style="font-family:var(--head);font-size:18px;font-weight:800">Sales<span style="color:var(--cyan)">Kit</span> <span style="color:var(--purple);font-size:12px">PLATFORM</span></div>
      <div style="font-size:11px;color:var(--muted)">Super Admin Dashboard</div>
      <span id="sysHealthBadge" title="Sức khoẻ hệ thống realtime" style="font-size:11px;font-weight:700;padding:3px 10px;border:1px solid var(--muted);border-radius:20px;color:var(--muted)">… Đang đọc</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-cyan" style="font-size:12px;padding:6px 14px" onclick="openCreateShopModal()">➕ Tạo shop mới</button>
      <button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="logoutSuper()">Đăng xuất</button>
    </div>
  </div>
  <div class="super-body">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px" id="superStats"></div>

    <!-- GIÁM SÁT HỆ THỐNG REALTIME -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-hd">
        <div class="card-hd-title">🩺 Giám sát hệ thống (Realtime)</div>
        <span id="monOverall" style="font-size:11px;padding:3px 12px;border-radius:20px;font-weight:700;color:var(--muted)">… Đang đọc</span>
      </div>
      <div class="card-body">
        <div id="monAlerts" style="margin-bottom:12px"></div>
        <div id="monMetrics" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:12px"></div>
        <div id="monFoot" style="font-size:11px;color:var(--muted);margin-top:12px"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-hd">
        <div class="card-hd-title">🏪 Tất cả Shop</div>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" onclick="loadSuperDashboard()">🔄 Làm mới</button>
      </div>
      <div style="padding:0">
        <div class="shop-row shop-row-hd">
          <div>Shop</div><div>Gói</div><div>KH</div><div>Tin</div><div>NV</div><div>Tạo lúc</div><div>Thao tác</div>
        </div>
        <div id="superShopList"><div class="empty" style="padding:20px">Đang tải...</div></div>
      </div>
    </div>

    <!-- Đơn chờ duyệt (chỉ chủ app xác nhận thanh toán) -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">🧾 Đơn chờ duyệt</div>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px" onclick="loadSuperOrders()">🔄 Làm mới</button>
      </div>
      <div style="padding:0;overflow-x:auto">
        <table>
          <thead><tr>
            <th style="padding:12px 20px">Mã đơn</th><th>Shop</th><th>Gói</th><th>Số tiền</th><th>Ngày tạo</th><th>Thao tác</th>
          </tr></thead>
          <tbody id="superOrdersTb"><tr><td colspan="6" class="empty" style="padding:16px">Đang tải...</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- Quản lý gói & giá -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">💲 Quản lý gói & giá</div>
        <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="saveSuperPlans()">💾 Lưu</button>
      </div>
      <div class="card-body">
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Chỉnh <strong>giá (VND/USD)</strong>, <strong>hạn mức</strong> (−1 = không giới hạn) và <strong>% giảm giá</strong> từng gói. Áp dụng ngay cho mọi shop.</div>
        <div id="superPlansBody" style="overflow-x:auto"><div class="empty" style="padding:12px">Đang tải...</div></div>
      </div>
    </div>

    <!-- Bank config -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">🏦 Tài khoản ngân hàng nhận thanh toán</div>
        <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="savePlatformBank()">💾 Lưu</button>
      </div>
      <div class="card-body">
        <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr">
          <div class="fg"><label>Ngân hàng (VietQR)</label>
            <select id="spBankCode">
              <option value="MB">MB Bank</option><option value="VCB">Vietcombank</option>
              <option value="TCB">Techcombank</option><option value="ACB">ACB</option>
              <option value="BIDV">BIDV</option><option value="VTB">Vietinbank</option>
              <option value="TPB">TPBank</option><option value="VPB">VPBank</option>
              <option value="MSB">MSB</option>
            </select>
          </div>
          <div class="fg"><label>Số tài khoản</label><input id="spBankAccount" placeholder="0123456789"/></div>
          <div class="fg"><label>Tên chủ tài khoản</label><input id="spBankHolder" placeholder="NGUYEN VAN A"/></div>
        </div>
        <div style="margin-top:10px;padding:10px;background:rgba(0,229,255,.04);border:1px solid rgba(0,229,255,.15);border-radius:8px;font-size:11px;color:var(--muted);line-height:1.8">
          <strong style="color:var(--text)">Webhook URL (SePay/Casso):</strong><br>
          <span id="spWebhookUrl" style="font-family:monospace;color:var(--cyan);word-break:break-all"></span>
        </div>
      </div>
    </div>

    <!-- Thanh toán quốc tế (platform owner cấu hình → tenant chỉ xem & copy) -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">🌐 Thanh toán quốc tế</div>
        <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="savePlatformPayments()">💾 Lưu</button>
      </div>
      <div class="card-body">
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Khách hàng (tenant) sẽ thấy các thông tin này ở trang <strong>Billing</strong> để thanh toán quốc tế — chỉ xem &amp; sao chép, không sửa được.</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr">
          <div class="fg"><label>💳 Stripe (link thanh toán)</label><input id="spPayStripe" placeholder="https://buy.stripe.com/..."/></div>
          <div class="fg"><label>🅿️ PayPal (email / paypal.me)</label><input id="spPayPaypal" placeholder="you@email.com hoặc paypal.me/ten"/></div>
          <div class="fg"><label>🟢 Wise (email / số tài khoản)</label><input id="spPayWise" placeholder="you@email.com hoặc Wise account"/></div>
          <div class="fg"><label>💠 Thẻ Visa / Card (link / hướng dẫn)</label><input id="spPayVisa" placeholder="Link cổng thẻ hoặc thông tin thẻ"/></div>
        </div>
      </div>
    </div>

    <!-- Stripe Checkout tự động (chủ app nhập key — không cần sửa .env) -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">💳 Stripe Checkout (tự động)</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span id="spStripeStatus" style="font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700">Đang tắt</span>
          <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="saveStripeConfig()">💾 Lưu</button>
        </div>
      </div>
      <div class="card-body">
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Nhập key để bật nút <strong>"Pay with Stripe"</strong> thanh toán thẻ tự động cho mọi shop. Lấy key tại <span style="color:var(--cyan)">dashboard.stripe.com</span>. Key được lưu ẩn, chỉ hiển thị 4 ký tự cuối.</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr">
          <div class="fg"><label>Secret Key (sk_live_... / sk_test_...)</label><input id="spStripeSecret" type="password" placeholder="sk_live_..."/></div>
          <div class="fg"><label>Webhook Secret (whsec_...)</label><input id="spStripeWebhook" type="password" placeholder="whsec_..."/></div>
          <div class="fg full" style="font-size:11px;color:var(--muted)">
            Webhook URL (dán vào Stripe → Developers → Webhooks): <span id="spStripeWebhookUrl" style="font-family:monospace;color:var(--cyan);word-break:break-all"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trợ lý AI hướng dẫn (Copilot) — chủ app bật cho toàn bộ shop -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">🤖 Trợ lý AI hướng dẫn (Copilot)</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span id="spCopilotStatus" style="font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700">○ Đang tắt</span>
          <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="saveCopilotConfig()">💾 Lưu</button>
        </div>
      </div>
      <div class="card-body">
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Bật trợ lý chat hướng dẫn (nút 🤖 góc phải dưới dashboard) cho <strong>tất cả shop</strong>. Dùng 1 key chung của bạn — shop không phải tự mang key. Khuyên dùng <strong>Gemini Flash</strong> (có quota miễn phí).</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr">
          <div class="fg"><label>Nhà cung cấp</label>
            <select id="spCopilotProvider">
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div class="fg"><label>Model</label><input id="spCopilotModel" placeholder="gpt-4o-mini hoặc gemini-2.5-flash"/></div>
          <div class="fg full"><label>API Key</label><input id="spCopilotKey" type="password" placeholder="sk-... (OpenAI) hoặc AIza... (Gemini)" oninput="onCopilotKeyInput()"/><div id="spCopilotHint" style="font-size:11px;margin-top:4px;color:var(--muted)"></div></div>
        </div>
      </div>
    </div>

    <!-- Thông tin liên hệ hỗ trợ (hiển thị cho tenant) -->
    <div class="card" style="margin-top:20px">
      <div class="card-hd">
        <div class="card-hd-title">📞 Thông tin liên hệ hỗ trợ</div>
        <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="savePlatformContact()">💾 Lưu</button>
      </div>
      <div class="card-body">
        <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Thông tin này hiển thị trong trang Cài đặt của khách hàng</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr">
          <div class="fg"><label>Email hỗ trợ</label><input id="spContactEmail" placeholder="support@yourcompany.com"/></div>
          <div class="fg"><label>Số điện thoại / Zalo</label><input id="spContactPhone" placeholder="0901 234 567"/></div>
          <div class="fg"><label>Telegram</label><input id="spContactTelegram" placeholder="@username hoặc https://t.me/username"/></div>
          <div class="fg"><label>WhatsApp</label><input id="spContactWhatsapp" placeholder="+84 901 234 567"/></div>
          <div class="fg full"><label>Ghi chú / Giờ hỗ trợ</label><input id="spContactNote" placeholder="Hỗ trợ 8h–22h, T2–CN"/></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- MODAL TẠO SHOP -->
<div class="modal-ov" id="createShopMod">
  <div class="modal"><h3>➕ Tạo shop mới cho khách hàng</h3>
    <div class="form-grid">
      <div class="fg"><label>Tên shop</label><input id="csName" placeholder="Shop Thời Trang ABC"/></div>
      <div class="fg"><label>Username admin</label><input id="csUser" placeholder="admin"/></div>
      <div class="fg"><label>Mật khẩu</label><input type="password" id="csPass" placeholder="••••••"/></div>
      <div class="fg"><label>Gói</label>
        <select id="csPlan">
          <option value="free">Free</option>
          <option value="basic">Basic - 299k/tháng</option>
          <option value="pro">Pro - 699k/tháng</option>
          <option value="enterprise">Enterprise - 1.999k/tháng</option>
        </select>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-ghost" onclick="document.getElementById('createShopMod').classList.remove('on')">Hủy</button>
      <button class="btn btn-cyan" onclick="createShopForCustomer()">🚀 Tạo shop</button>
    </div>
  </div>
</div>

<div class="toast-wrap" id="toastWrap"></div>

<!-- MODAL EDIT KHÁCH -->
<div class="modal-ov" id="editMod">
  <div class="modal"><h3>✏️ Chỉnh sửa khách hàng</h3>
    <div class="form-grid">
      <input type="hidden" id="eid">
      <div class="fg"><label>Tên</label><input id="en"/></div>
      <div class="fg"><label>Điện thoại</label><input id="ep"/></div>
      <div class="fg"><label>Email</label><input id="ee"/></div>
      <div class="fg"><label>Trạng thái</label><select id="es"><option value="new">Mới</option><option value="hot">Hot</option><option value="close">Chốt</option><option value="cold">Lạnh</option></select></div>
      <div class="fg full"><label>Ghi chú</label><textarea id="eno"></textarea></div>
    </div>
    <div class="modal-ft"><button class="btn btn-ghost" onclick="closeMod()">Hủy</button><button class="btn btn-cyan" onclick="saveEdit(this)">💾 Lưu</button></div>
  </div>
</div>

<!-- MODAL PRODUCT -->
<div class="modal-ov" id="prodMod">
  <div class="modal"><h3>📦 Thêm / Sửa sản phẩm</h3>
    <div class="form-grid">
      <input type="hidden" id="pid">
      <div class="fg"><label>Tên sản phẩm</label><input id="pname"/></div>
      <div class="fg"><label>Giá (VND)</label><input id="pprice"/></div>
      <div class="fg"><label>Tồn kho</label><input id="pstock" type="number" placeholder="0"/></div>
      <div class="fg"><label>Emoji</label><input id="pemoji" placeholder="📦"/></div>
      <div class="fg"><label>Badge</label><select id="pbadge"><option value="">Không</option><option value="hot">🔥 Hot</option><option value="new">✨ New</option></select></div>
      <div class="fg full"><label>Mô tả</label><textarea id="pdesc"></textarea></div>
      <div class="fg full"><label>Tags (phẩy cách nhau)</label><input id="ptags" placeholder="bền, đẹp, hot"/></div>
      <div class="fg full">
        <label>Ảnh sản phẩm (tuỳ chọn)</label>
        <input type="hidden" id="pimage"/>
        <div style="display:flex;align-items:center;gap:10px">
          <img id="pimgPreview" src="" alt="" style="display:none;width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--border)"/>
          <input type="file" id="pimgFile" accept="image/*" onchange="uploadProdImage(this)" style="font-size:12px"/>
          <button type="button" class="btn btn-ghost" style="font-size:11px;padding:3px 8px" onclick="clearProdImage()">Xoá ảnh</button>
        </div>
        <div id="pimgHint" style="font-size:11px;color:var(--muted);margin-top:4px">Chọn ảnh từ máy (tối đa 5MB). Không có ảnh sẽ dùng emoji.</div>
      </div>
    </div>
    <div class="modal-ft"><button class="btn btn-ghost" onclick="closeProdMod()">Hủy</button><button class="btn btn-cyan" onclick="saveProd()">💾 Lưu sản phẩm</button></div>
  </div>
</div>

<!-- MODAL GỬI TIN HÀNG LOẠT -->
<div class="modal-ov" id="bcMod">
  <div class="modal" style="max-width:480px">
    <h3>📣 Gửi tin hàng loạt</h3>
    <div id="bcAudience" style="font-size:12px;color:var(--muted);margin-bottom:10px">Đang đếm người nhận...</div>
    <div class="fg full"><label>Nội dung tin</label><textarea id="bcText" style="min-height:90px" placeholder="VD: 🎉 Shop sale 30% cuối tuần! Inbox ngay để được tư vấn nhé..."></textarea></div>
    <div style="font-size:11px;color:var(--amber);margin-top:6px;line-height:1.6">⚠️ Tin sẽ gửi tới TẤT CẢ khách đã từng nhắn. Kênh có token (FB/Zalo/TG) sẽ được đẩy thật; còn lại lưu vào hội thoại.</div>
    <div class="modal-ft"><button class="btn btn-ghost" onclick="closeBroadcast()">Hủy</button><button class="btn btn-purple" onclick="sendBroadcast()">📣 Gửi ngay</button></div>
  </div>
</div>

<!-- MODAL TẠO ĐƠN HÀNG -->
<div class="modal-ov" id="orderMod">
  <div class="modal" style="max-width:580px">
    <h3>🛒 Tạo đơn hàng</h3>
    <div class="form-grid">
      <div class="fg"><label>Tên khách</label><input id="oName" placeholder="Nguyễn Văn A"/></div>
      <div class="fg"><label>Số điện thoại</label><input id="oPhone" placeholder="09xx xxx xxx"/></div>
      <div class="fg full"><label>Địa chỉ giao</label><input id="oAddr" placeholder="Số nhà, đường, phường, quận, tỉnh"/></div>
    </div>
    <div style="margin:12px 0;padding:12px;background:var(--s1);border:1px solid var(--border);border-radius:10px">
      <div style="display:flex;gap:8px;align-items:flex-end">
        <div class="fg" style="flex:1;margin:0"><label>Sản phẩm</label><select id="oProd"></select></div>
        <div class="fg" style="width:72px;margin:0"><label>SL</label><input id="oQty" type="number" value="1" min="1"/></div>
        <button class="btn btn-cyan" style="padding:9px 12px" onclick="addOrderItem()">+ Thêm</button>
      </div>
      <div id="oItems" style="margin-top:12px"></div>
      <div style="text-align:right;font-weight:800;font-size:17px;margin-top:10px">Tổng: <span id="oTotal" style="color:var(--cyan)">0đ</span></div>
    </div>
    <div class="fg full"><label>Ghi chú</label><input id="oNote" placeholder="Giao giờ hành chính, gọi trước khi giao..."/></div>
    <div class="modal-ft"><button class="btn btn-ghost" onclick="closeOrderMod()">Hủy</button><button class="btn btn-cyan" onclick="saveOrder()">💾 Lưu đơn</button></div>
  </div>
</div>

<!-- TIMELINE MODAL -->
<div class="tl-modal" id="tlModal">
  <div class="tl-box">
    <div class="tl-head">
      <div>
        <div style="font-family:var(--head);font-size:16px;font-weight:700" id="tlName">Timeline</div>
        <div style="font-size:11px;color:var(--muted)" id="tlSub"></div>
      </div>
      <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" onclick="closeTL()">✕ Đóng</button>
    </div>
    <div class="tl-body" id="tlBody"><div class="empty">Đang tải...</div></div>
  </div>
</div>

<!-- QR PAYMENT MODAL -->
<!-- COPILOT — Trợ lý AI hướng dẫn (nổi góc phải dưới) -->
<div id="copilotFab" onclick="toggleCopilot()" title="Trợ lý hướng dẫn"
  style="display:none;position:fixed;right:22px;bottom:22px;z-index:9998;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#00e5ff);align-items:center;justify-content:center;font-size:26px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4)">🤖</div>

<div id="copilotPanel"
  style="display:none;position:fixed;right:22px;bottom:90px;z-index:9999;width:368px;max-width:92vw;height:540px;max-height:80vh;background:var(--s2,#15152a);border:1px solid var(--border,#2a2a44);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.55);flex-direction:column;overflow:hidden">
  <div style="padding:12px 14px;background:linear-gradient(135deg,#7c3aed,#00e5ff);display:flex;align-items:center;justify-content:space-between">
    <div style="font-weight:700;color:#fff;font-size:14px">🤖 Trợ lý hướng dẫn</div>
    <span style="cursor:pointer;color:#fff;font-size:18px;line-height:1" onclick="toggleCopilot()">✕</span>
  </div>
  <div id="copilotMsgs" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:13px;line-height:1.6"></div>
  <div id="copilotRemaining" style="padding:2px 12px 0;font-size:10px;color:var(--muted);text-align:center"></div>
  <div id="copilotQuick" style="padding:4px 10px 6px;display:flex;flex-wrap:wrap;gap:6px"></div>
  <div style="padding:10px;border-top:1px solid var(--border,#2a2a44);display:flex;gap:8px">
    <input id="copilotInput" placeholder="Hỏi cách làm... (vd: cách kết nối Facebook)"
      style="flex:1;padding:9px 12px;border-radius:10px;border:1px solid var(--border,#2a2a44);background:var(--s1,#0e0e1c);color:var(--text,#fff);font-size:13px"
      onkeydown="if(event.key==='Enter')sendCopilot()"/>
    <button class="btn btn-cyan" style="padding:8px 14px" onclick="sendCopilot()">Gửi</button>
  </div>
</div>

<!-- MODAL THANH TOÁN QUỐC TẾ (thủ công: PayPal / Wise / Visa) -->
<div class="modal-ov" id="intlPayMod">
  <div class="modal" style="max-width:480px">
    <h3 style="margin-bottom:4px">🌐 Thanh toán quốc tế</h3>
    <div id="intlPayInfo" style="font-size:13px"><div class="empty">Đang tạo đơn...</div></div>
    <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:14px" onclick="closeIntlPay()">Đóng</button>
  </div>
</div>

<div class="qr-modal" id="qrModal">
  <div class="qr-box">
    <div class="qr-head">
      <div>
        <div style="font-family:var(--head);font-size:16px;font-weight:800">💳 Thanh toán chuyển khoản</div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px" id="qrPlanLabel">Nâng cấp gói</div>
      </div>
      <button class="btn btn-ghost" style="font-size:12px;padding:5px 10px" onclick="closeQR()">✕</button>
    </div>
    <div class="qr-body">
      <div>
        <div class="qr-img-wrap">
          <img id="qrImage" alt="VietQR" onerror="this.alt='⚠️ QR không tải được — Dùng thông tin bên cạnh'"/>
        </div>
        <div class="qr-amount" id="qrAmount">0đ</div>
        <div class="qr-timer" id="qrTimer">⏱ QR còn hiệu lực: --:--</div>
        <div style="font-size:10px;color:var(--dim);text-align:center">Quét bằng app ngân hàng bất kỳ</div>
      </div>
      <div class="qr-info">
        <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Thông tin chuyển khoản</div>
        <div class="qr-row"><span>Ngân hàng</span><span class="qr-val" id="qrBank">MB Bank</span></div>
        <div class="qr-row"><span>Số TK</span>
          <span class="qr-val" onclick="copyQR('qrAccNo')" title="Nhấn để copy">
            <span id="qrAccNo">0123456789</span> 📋
          </span>
        </div>
        <div class="qr-row"><span>Chủ TK</span><span id="qrHolder" style="font-weight:600;font-size:12px">SALESKIT PRO</span></div>
        <div class="qr-row" style="flex-direction:column;align-items:flex-start;gap:5px">
          <span style="color:var(--muted);font-size:11px">Nội dung (bắt buộc)</span>
          <span class="qr-val" style="word-break:break-all;font-size:11px" onclick="copyQR('qrContent')" title="Nhấn để copy">
            <span id="qrContent">SALESKIT demo-shop SK...</span> 📋
          </span>
        </div>
        <div style="margin-top:10px;padding:8px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:8px;font-size:10px;color:var(--amber);line-height:1.7">
          ⚠️ Nhập <strong>đúng nội dung</strong> để hệ thống tự duyệt.<br>Sai nội dung → cần xác nhận thủ công.
        </div>
      </div>
    </div>
    <div class="qr-status" id="qrStatus">
      <div class="qs-waiting">
        <span class="spin">⟳</span> Đang chờ thanh toán... Hệ thống tự xác nhận sau khi nhận tiền
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;justify-content:center">
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="closeQR()">Hủy đơn</button>
        <button class="btn btn-amber" style="font-size:11px;padding:5px 12px" id="qrConfirmBtn" onclick="checkPaymentManual()">
          ✅ Tôi đã chuyển khoản
        </button>
      </div>
    </div>
  </div>
</div>

<div class="shell">
  <div class="sidebar">
    <div class="logo"><div class="logo-mark"><div class="dot"></div>SalesKit Pro</div><div class="logo-sub">v3.0 · PostgreSQL</div></div>
    <nav>
      <div class="nav-section" data-i18n="section.overview">Tổng quan</div>
      <div class="nav-btn on tooltip" data-tip="Ctrl+D" onclick="go('dashboard')"><span class="ni">📊</span><span data-i18n="dashboard">Dashboard</span></div>
      <div class="nav-btn tooltip" data-tip="Ctrl+K" onclick="go('customers')"><span class="ni">👥</span><span data-i18n="customers">Khách hàng</span></div>
      <div class="nav-btn" onclick="go('kanban')"><span class="ni">🗂️</span><span data-i18n="kanban">Kanban Board</span></div>
      <div class="nav-btn" onclick="go('orders')"><span class="ni">🧾</span><span data-i18n="orders">Đơn hàng</span></div>
      <div class="nav-btn tooltip" data-tip="Ctrl+I" onclick="go('inbox')"><span class="ni">📬</span><span data-i18n="inbox">Hộp thư chung</span> <span class="nbadge" id="inboxBadge" style="display:none">0</span></div>
      <div class="nav-btn" onclick="go('addcust')"><span class="ni">➕</span><span data-i18n="addcust">Thêm khách</span></div>
      <div class="nav-section" data-i18n="section.chatbot">Chat Bot</div>
      <div class="nav-btn" onclick="go('botconfig')"><span class="ni">🤖</span><span data-i18n="botconfig">Preview Bot</span></div>
      <div class="nav-btn" onclick="go('products')"><span class="ni">📦</span><span data-i18n="products">Data sản phẩm</span></div>
      <div class="nav-btn" onclick="go('autorules')"><span class="ni">⚡</span><span data-i18n="autorules">Auto Reply Rules</span></div>
      <div class="nav-section" data-i18n="section.deploy">Nhúng &amp; Deploy</div>
      <div class="nav-btn" onclick="go('embed')"><span class="ni">🔌</span><span data-i18n="embed">Nhúng Widget</span></div>
      <div class="nav-btn" onclick="go('channels')"><span class="ni">📡</span><span data-i18n="channels">Kênh kết nối</span></div>
      <div class="nav-section" data-i18n="section.report">Báo cáo &amp; Team</div>
      <div class="nav-btn" onclick="go('funnel')"><span class="ni">📈</span><span data-i18n="funnel">Phễu chuyển đổi</span></div>
      <div class="nav-btn" onclick="go('team')"><span class="ni">👨‍💼</span><span data-i18n="team">Quản lý Team</span></div>
      <div class="nav-section" data-i18n="section.ai">AI &amp; Tự động hóa</div>
      <div class="nav-btn" onclick="go('aiconfig')"><span class="ni">🧠</span><span data-i18n="aiconfig">AI Agent Config</span></div>
      <div class="nav-btn" onclick="go('leads')"><span class="ni">🎯</span><span data-i18n="leads">Lead Scoring</span></div>
      <div class="nav-section" data-i18n="section.biz">Kinh doanh</div>
      <div class="nav-btn" onclick="go('billing')"><span class="ni">💳</span><span data-i18n="billing">Billing &amp; Gói</span></div>
      <div class="nav-btn" onclick="go('settings')"><span class="ni">⚙️</span><span data-i18n="settings">Cài đặt</span></div>
    </nav>
    <div class="sidebar-footer">
      <div class="user-row"><div class="user-av" id="userAv">A</div><div><div style="font-size:12px;font-weight:600" id="userLabel">admin</div><div style="font-size:10px;color:var(--muted)" id="shopLabel">Shop</div></div></div>
      <span style="cursor:pointer;color:var(--pink);font-size:11px" onclick="logout()">← Đăng xuất</span>
    </div>
  </div>

  <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  <div class="main">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="hamburger" id="hamburgerBtn" onclick="toggleSidebar()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <div class="topbar-title" id="pgTitle">📊 Dashboard</div>
      </div>
      <div class="topbar-right">
        <span style="font-size:11px;color:var(--muted);font-family:monospace" id="clk"></span>
        <div class="rtbadge" id="rtStatus" title="WebSocket real-time"><span id="rtIcon">⚪</span> Đang kết nối...</div>
        <div class="live-pill"><div class="live-dot"></div>LIVE · PostgreSQL</div>
        <button class="theme-btn" id="langBtn" onclick="toggleLang()" title="Switch language" style="font-size:12px;padding:0 8px;width:auto">🇬🇧 EN</button>
        <button class="theme-btn" id="themeBtn" onclick="toggleTheme()" title="Đổi giao diện">🌙</button>
      </div>
    </div>

    <!-- DASHBOARD -->
    <div class="page on" id="page-dashboard">
      <div class="stats-row">
        <div class="stat c0"><div class="stat-lbl">Tổng khách</div><div class="stat-val" id="s0">–</div><div class="stat-sub" id="s0s">– hôm nay</div><div class="stat-icon">👥</div></div>
        <div class="stat c1"><div class="stat-lbl">Đã chốt</div><div class="stat-val" id="s1">–</div><div class="stat-sub" id="s1r">Tỷ lệ –%</div><div class="stat-icon">✅</div></div>
        <div class="stat c2"><div class="stat-lbl">Sản phẩm</div><div class="stat-val" id="s2">–</div><div class="stat-sub">Trong kho</div><div class="stat-icon">📦</div></div>
        <div class="stat c3"><div class="stat-lbl">Bot trả lời</div><div class="stat-val" id="s3">–</div><div class="stat-sub">Tổng lần</div><div class="stat-icon">🤖</div></div>
      </div>
      <div class="dash-grid">
        <div>
          <div class="card" style="margin-bottom:14px">
            <div class="card-hd"><div class="card-hd-title">📈 Khách hàng 7 ngày qua</div></div>
            <div class="card-body" style="padding:16px"><canvas id="weekChart" height="120"></canvas></div>
          </div>
          <div class="card">
            <div class="card-hd"><div class="card-hd-title">Khách hàng gần đây</div><button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="go('customers')">Xem tất cả →</button></div>
            <div class="card-body"><table><thead><tr><th>Khách</th><th>SĐT</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody id="recentTb"></tbody></table></div>
          </div>
        </div>
        <div>
          <div class="card" style="margin-bottom:14px">
            <div class="card-hd"><div class="card-hd-title">📡 Kênh chat</div></div>
            <div class="card-body" id="channelStats"></div>
          </div>
          <div class="card"><div class="card-hd"><div class="card-hd-title">Hoạt động</div></div><div class="card-body" id="actFeed"><div class="empty">Đang tải...</div></div></div>
        </div>
      </div>
    </div>

    <!-- KANBAN BOARD -->
    <div class="page" id="page-kanban">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <div style="font-size:13px;color:var(--muted)">Kéo thẻ khách hàng sang cột khác để đổi trạng thái</div>
        <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="loadKanban()">🔄 Làm mới</button>
      </div>
      <div class="kanban-wrap" id="kanbanWrap">
        <div class="kc" id="kc-new"   data-status="new"   ondragover="onDragOver(event)" ondrop="onDrop(event,this)">
          <div class="kc-header"><span class="kc-title" style="color:var(--cyan)">🆕 Mới</span><span class="kc-count" id="kc-count-new">0</span></div>
          <div class="kc-cards" id="kcc-new"></div>
        </div>
        <div class="kc" id="kc-hot"   data-status="hot"   ondragover="onDragOver(event)" ondrop="onDrop(event,this)">
          <div class="kc-header"><span class="kc-title" style="color:var(--pink)">🔥 Hot</span><span class="kc-count" id="kc-count-hot">0</span></div>
          <div class="kc-cards" id="kcc-hot"></div>
        </div>
        <div class="kc" id="kc-close" data-status="close" ondragover="onDragOver(event)" ondrop="onDrop(event,this)">
          <div class="kc-header"><span class="kc-title" style="color:var(--green)">✅ Chốt</span><span class="kc-count" id="kc-count-close">0</span></div>
          <div class="kc-cards" id="kcc-close"></div>
        </div>
        <div class="kc" id="kc-cold"  data-status="cold"  ondragover="onDragOver(event)" ondrop="onDrop(event,this)">
          <div class="kc-header"><span class="kc-title" style="color:var(--muted)">❄️ Lạnh</span><span class="kc-count" id="kc-count-cold">0</span></div>
          <div class="kc-cards" id="kcc-cold"></div>
        </div>
      </div>
    </div>

    <!-- SHARED INBOX -->
    <div class="page" id="page-inbox" style="padding:12px 16px">
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:8px">
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;border-color:var(--purple);color:var(--purple)"
          onclick="openBroadcast()">📣 Gửi tin hàng loạt</button>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px;border-color:var(--amber);color:var(--amber)"
          onclick="toggleSimPanel()">🧪 Simulate Tool</button>
      </div>
      <div class="inbox-wrap" style="position:relative">
        <!-- Conversation list -->
        <div class="inbox-list">
          <div class="inbox-search"><input id="inboxSearch" placeholder="🔍 Tìm cuộc hội thoại..." oninput="filterInboxList()"/></div>
          <div id="inboxConvList" style="flex:1;overflow-y:auto"></div>
        </div>
        <!-- Chat area -->
        <div class="inbox-main" id="inboxMain">
          <div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted)">
            <div style="text-align:center"><div style="font-size:48px;margin-bottom:12px">📬</div><div>Chọn một cuộc hội thoại</div></div>
          </div>
        </div>
        <!-- Simulate Tool (dev) -->
        <div id="simPanel" style="position:absolute;bottom:0;left:0;right:600px;background:var(--s2);border-top:2px solid var(--amber);padding:10px 14px;display:none;z-index:10">
          <div style="font-size:10px;font-weight:700;color:var(--amber);letter-spacing:1px;margin-bottom:8px">🧪 SIMULATE MESSAGE (test luồng thật)</div>
          <div style="display:flex;gap:8px;align-items:center">
            <select id="simChannel" style="width:110px;font-size:12px;padding:5px 8px">
              <option value="facebook">📘 Facebook</option>
              <option value="zalo">🟦 Zalo</option>
              <option value="web">🌐 Web</option>
            </select>
            <input id="simSender" placeholder="sender_id (tùy chọn)" style="width:140px;font-size:12px;padding:5px 8px"/>
            <input id="simText" placeholder="Tin nhắn test..." style="flex:1;font-size:12px;padding:5px 8px"
              onkeydown="if(event.key==='Enter')runSimulate()"/>
            <button class="btn btn-amber" style="font-size:12px;padding:5px 12px;white-space:nowrap" onclick="runSimulate()">▶ Gửi</button>
          </div>
          <div id="simResult" style="margin-top:6px;font-size:11px;color:var(--muted);display:none"></div>
        </div>

        <!-- Customer side panel -->
        <div class="inbox-side" id="inboxSide" style="display:none">
          <div style="padding:14px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Thông tin khách</div>
          <div id="inboxSideContent" style="padding:14px;font-size:12.5px;line-height:2"></div>
          <div style="padding:14px;border-top:1px solid var(--border)">
            <button class="btn btn-cyan" style="width:100%;justify-content:center;font-size:12px;margin-bottom:8px" onclick="linkCustomerInbox()">🔗 Gán khách hàng</button>
            <button class="btn btn-ghost" style="width:100%;justify-content:center;font-size:12px" onclick="openTimelineFromInbox()">📋 Xem Timeline</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CUSTOMERS -->
    <div class="page" id="page-customers">
      <div style="display:flex;gap:10px;margin-bottom:12px;align-items:center">
        <input style="flex:1" placeholder="🔍 Tìm kiếm tên, SĐT, email..." id="custSearch" oninput="debouncedRenderCust()"/>
        <select onchange="renderCust()" id="fstatus"><option value="">Tất cả</option><option value="new">Mới</option><option value="hot">Hot</option><option value="close">Chốt</option><option value="cold">Lạnh</option></select>
        <button class="btn btn-ghost" style="font-size:12px" onclick="exportCSV()" title="Xuất file Excel/CSV">📥 Xuất CSV</button>
        <button class="btn btn-cyan" onclick="go('addcust')">➕ Thêm khách</button>
      </div>
      <div class="bulk-bar" id="bulkBar">
        <span class="bulk-count" id="bulkCount">0 đã chọn</span>
        <select id="bulkStatus" style="font-size:12px;padding:4px 8px;border-radius:6px;background:var(--s2);border:1px solid var(--border);color:var(--text)">
          <option value="">Đổi trạng thái...</option>
          <option value="new">🆕 Mới</option><option value="hot">🔥 Hot</option>
          <option value="close">✅ Chốt</option><option value="cold">❄️ Lạnh</option>
        </select>
        <button class="btn btn-purple" style="font-size:11px;padding:4px 12px" onclick="bulkChangeStatus()">✅ Áp dụng</button>
        <button class="btn btn-red"    style="font-size:11px;padding:4px 12px" onclick="bulkDelete()">🗑️ Xóa</button>
        <button class="btn btn-ghost"  style="font-size:11px;padding:4px 10px" onclick="clearBulk()">✕</button>
      </div>
      <div class="card">
        <table><thead><tr>
          <th style="padding:14px 14px 14px 20px;width:36px"><input type="checkbox" id="chkAll" onchange="toggleSelectAll(this.checked)" title="Chọn tất cả"/></th>
          <th style="padding:14px 0">Khách hàng</th><th>SĐT</th><th>Email</th><th>Trạng thái</th><th>Ngày</th><th>Thao tác</th>
        </tr></thead><tbody id="custTb"></tbody></table>
        <div id="custEmpty" class="empty" style="display:none">Chưa có khách hàng</div>
        <div class="pg-wrap" id="custPg" style="display:none">
          <span id="pgInfo"></span>
          <div class="pg-btns" id="pgBtns"></div>
        </div>
      </div>
    </div>

    <!-- ADD CUSTOMER -->
    <div class="page" id="page-addcust">
      <div class="card" style="max-width:660px">
        <div class="card-hd"><div class="card-hd-title">📋 Thêm khách hàng mới</div></div>
        <div class="card-body"><div class="form-grid">
          <div class="fg"><label>Họ tên *</label><input id="fn" placeholder="Nguyễn Văn A"/></div>
          <div class="fg"><label>Điện thoại *</label><input id="fph" placeholder="0901 234 567"/></div>
          <div class="fg"><label>Email</label><input id="fem" placeholder="email@gmail.com"/></div>
          <div class="fg"><label>Nguồn</label><select id="fsrc"><option>Facebook</option><option>Zalo</option><option>Google</option><option>Giới thiệu</option><option>Khác</option></select></div>
          <div class="fg"><label>Sản phẩm quan tâm</label><input id="fpr" placeholder="Sản phẩm A..."/></div>
          <div class="fg"><label>Trạng thái</label><select id="fst"><option value="new">🆕 Mới</option><option value="hot">🔥 Hot</option><option value="close">✅ Chốt</option><option value="cold">❄️ Lạnh</option></select></div>
          <div class="fg full"><label>Ghi chú</label><textarea id="fno" placeholder="Ghi chú..."></textarea></div>
          <div class="fa"><button class="btn btn-cyan" onclick="addCust(this)">💾 Lưu khách hàng</button><button class="btn btn-ghost" onclick="clearCustForm()">🗑️ Xóa trắng</button></div>
        </div></div>
      </div>
    </div>

    <!-- BOT CONFIG -->
    <div class="page" id="page-botconfig">
      <div class="bot-preview-wrap">
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-hd"><div class="card-hd-title">🤖 Cấu hình chatbot</div><button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="saveBotConfig()">💾 Lưu</button></div>
            <div class="card-body">
              <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr">
                <div class="fg"><label>Tên Bot</label><input id="botname" oninput="updateBotPreview()"/></div>
                <div class="fg"><label>Màu chính</label><input id="botcolor" oninput="updateBotPreview()"/></div>
                <div class="fg"><label>Avatar Emoji</label><input id="botavatar" oninput="updateBotPreview()"/></div>
              </div>
              <div class="fg" style="margin-top:10px"><label>Tin chào mừng</label><input id="botwelcome" oninput="updateBotPreview()"/></div>
              <div style="margin-top:14px">
                <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Quick reply buttons</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px" id="quickBtnList"></div>
                <div style="display:flex;gap:8px"><input id="newQBtn" placeholder="Thêm quick button..." style="flex:1"/><button class="btn btn-ghost" style="font-size:12px" onclick="addQuickBtn()">+ Thêm</button></div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-hd"><div class="card-hd-title">📊 Bot Stats</div></div>
            <div class="card-body" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
              <div><div style="font-family:var(--head);font-size:22px;font-weight:800" id="bsRules">–</div><div style="font-size:11px;color:var(--muted)">Rules</div></div>
              <div><div style="font-family:var(--head);font-size:22px;font-weight:800" id="bsProds">–</div><div style="font-size:11px;color:var(--muted)">Sản phẩm</div></div>
              <div><div style="font-family:var(--head);font-size:22px;font-weight:800" id="bsAuto">–</div><div style="font-size:11px;color:var(--muted)">Đã trả lời</div></div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">📱 Live Preview</div>
          <div class="bot-phone" id="botPhone">
            <div class="bot-phone-hd" id="phoneHd">
              <div class="bot-phone-av" id="phoneAv">🤖</div>
              <div><div style="font-weight:700;font-size:13px;color:#fff" id="phoneName">Bot</div><div style="font-size:10px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:4px"><span style="width:5px;height:5px;border-radius:50%;background:#4ade80;display:inline-block"></span>Đang hoạt động</div></div>
            </div>
            <div class="bot-msgs" id="phoneMsgs"></div>
            <div class="quick-btns" id="phoneQBtns"></div>
            <div class="bot-input-row">
              <input class="bi" id="phoneInput" placeholder="Nhập tin nhắn..." onkeydown="if(event.key==='Enter')botSend()"/>
              <button class="bs" onclick="botSend()">➤</button>
            </div>
          </div>
          <button class="btn btn-purple" onclick="go('embed')" style="font-size:12px">🔌 Lấy code nhúng →</button>
        </div>
      </div>
    </div>

    <!-- PRODUCTS -->
    <div class="page" id="page-products">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <div style="font-size:13px;color:var(--muted)">Bot dùng để tư vấn. Dùng <code style="color:var(--cyan)">{tên_sp}</code> và <code style="color:var(--cyan)">{giá_sp}</code> trong rules.</div>
        <button class="btn btn-cyan" onclick="openAddProd()">📦 Thêm sản phẩm</button>
      </div>
      <div class="prod-grid" id="prodGrid"></div>
      <div id="prodEmpty" class="empty" style="display:none">Chưa có sản phẩm — hãy thêm để bot tư vấn hiệu quả hơn</div>
    </div>

    <!-- AUTO RULES -->
    <div class="page" id="page-autorules">
      <div style="max-width:700px">
        <div style="padding:10px 14px;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.2);border-radius:8px;font-size:12px;color:var(--muted);margin-bottom:14px">
          💡 Dùng <code style="color:var(--cyan)">{tên_sp}</code>, <code style="color:var(--cyan)">{giá_sp}</code>, <code style="color:var(--cyan)">{product_list}</code> để bot tự điền thông tin.
        </div>
        <div class="card" style="margin-bottom:14px">
          <div class="card-hd"><div class="card-hd-title">⚡ Quy tắc Auto Reply</div></div>
          <div class="card-body">
            <div id="rulesList"></div>
            <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:6px">
              <div class="form-grid" style="grid-template-columns:1fr 2fr">
                <div class="fg"><label>Từ khóa (dùng | để OR)</label><input id="nkw" placeholder='"giá|bao nhiêu"'/></div>
                <div class="fg"><label>Câu trả lời</label><input id="nrep" placeholder="Câu trả lời tự động..."/></div>
              </div>
              <button class="btn btn-cyan" style="margin-top:10px" onclick="addRule()">✅ Thêm quy tắc</button>
            </div>
          </div>
        </div>
        <div class="card"><div class="card-hd"><div class="card-hd-title">📊 Thống kê</div></div><div class="card-body" id="ruleStats"></div></div>
      </div>
    </div>

    <!-- EMBED -->
    <div class="page" id="page-embed">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        <div>
          <div class="card" style="margin-bottom:14px">
            <div class="card-hd"><div class="card-hd-title">🔌 Code nhúng (kết nối backend)</div><button class="copy-btn" onclick="copyEmbed()">Copy</button></div>
            <div class="card-body" style="padding:12px">
              <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Dán vào trước <code style="color:var(--cyan)">&lt;/body&gt;</code> trên website của shop</div>
              <div class="embed-box"><pre id="embedPre" style="white-space:pre-wrap;word-break:break-all"></pre></div>
            </div>
          </div>
          <div class="card">
            <div class="card-hd"><div class="card-hd-title">💾 Tải file widget</div></div>
            <div class="card-body"><div style="display:flex;gap:8px"><button class="btn btn-cyan" onclick="downloadWidgetConnected()">📥 Widget (kết nối backend)</button></div></div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-hd"><div class="card-hd-title">👁️ Preview</div></div>
            <div class="card-body" style="padding:10px">
              <div style="background:#f0f0f5;border-radius:10px;height:400px;position:relative;overflow:hidden;">
                <div style="padding:16px;font-family:sans-serif;font-size:13px;color:#333">
                  <div style="background:#fff;border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.1)"><div style="font-weight:700;margin-bottom:4px">Website của Shop</div><div style="font-size:11px;color:#888">Widget nổi ở góc dưới phải 👇</div></div>
                </div>
                <div style="position:absolute;bottom:14px;right:14px;display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                  <div style="background:#fff;border-radius:12px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.2);max-width:200px;font-size:12px;color:#333;border:1px solid #eee">
                    <div style="font-weight:700;margin-bottom:3px" id="prevBotName">Bot</div>
                    <div style="color:#666">Xin chào! Mình có thể giúp gì? 👋</div>
                  </div>
                  <div id="prevBtn" style="width:50px;height:50px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,.5)">💬</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CHANNELS -->
    <div class="page" id="page-channels">
      <div style="max-width:800px">
        <div style="font-size:12.5px;color:var(--muted);margin-bottom:18px;padding:12px 16px;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.2);border-radius:8px">
          💡 Điền token → Lưu → Khai báo Webhook URL với Facebook/Zalo. Token được mã hóa lưu trong PostgreSQL.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <!-- Facebook -->
          <div class="channel-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">📘</span><div><div style="font-size:14px;font-weight:700">Facebook Messenger</div><div id="fbStatus" class="channel-status cs-inactive">● Chưa kết nối</div></div></div>
            </div>
            <div class="fg" style="margin-bottom:8px"><label>Page Access Token</label><input id="fbToken" placeholder="EAAxxxxxxxxx..." type="password"/></div>
            <div class="fg" style="margin-bottom:12px"><label>Verify Token (tự đặt)</label><input id="fbVerify" placeholder="my_verify_token_abc123"/></div>
            <div class="fg" style="margin-bottom:12px"><label>Webhook URL</label>
              <div style="display:flex;gap:6px"><input id="fbWebhook" readonly style="font-size:11px;font-family:monospace"/><button class="btn btn-ghost" style="font-size:10px;padding:4px 8px;white-space:nowrap" onclick="copyField('fbWebhook')">Copy</button></div>
            </div>
            <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:12.5px;cursor:pointer">
              <input type="checkbox" id="fbAutoComment" style="width:17px;height:17px;accent-color:var(--cyan)"/>
              <span>💬 Tự động trả lời <strong>bình luận</strong> dưới bài (rep công khai + nhắn riêng inbox)</span>
            </label>
            <button class="btn btn-cyan" style="width:100%;justify-content:center" onclick="saveFB()">💾 Save FB Config</button>
            <div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:8px;font-size:11px;color:var(--muted);line-height:1.8">
              <strong style="color:var(--text)">Setup:</strong><br>
              1. developers.facebook.com → App → Messenger<br>
              2. Select Page → get Page Access Token<br>
              3. Set Webhook URL + Verify Token<br>
              4. Subscribe: <code style="color:var(--cyan)">messages</code>
            </div>
          </div>
          <!-- Zalo -->
          <div class="channel-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">🟦</span><div><div style="font-size:14px;font-weight:700">Zalo Official Account</div><div id="zaloStatus" class="channel-status cs-inactive">● Chưa kết nối</div></div></div>
            </div>
            <div class="fg" style="margin-bottom:8px"><label>OA Access Token</label><input id="zaloToken" placeholder="oaToken_xxx..." type="password"/></div>
            <div class="fg" style="margin-bottom:12px"><label>App Secret</label><input id="zaloSecret" placeholder="app_secret..." type="password"/></div>
            <div class="fg" style="margin-bottom:12px"><label>Webhook URL</label>
              <div style="display:flex;gap:6px"><input id="zaloWebhook" readonly style="font-size:11px;font-family:monospace"/><button class="btn btn-ghost" style="font-size:10px;padding:4px 8px;white-space:nowrap" onclick="copyField('zaloWebhook')">Copy</button></div>
            </div>
            <button class="btn btn-cyan" style="width:100%;justify-content:center" onclick="saveZalo()">💾 Save Zalo Config</button>
            <div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:8px;font-size:11px;color:var(--muted);line-height:1.8">
              <strong style="color:var(--text)">Setup:</strong><br>
              1. developers.zalo.me → App → Zalo OA<br>
              2. Link OA → get OA Access Token<br>
              3. Set Webhook URL<br>
              4. Enable: <code style="color:var(--cyan)">user_send_text</code>
            </div>
          </div>
          <!-- Telegram -->
          <div class="channel-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">✈️</span><div><div style="font-size:14px;font-weight:700">Telegram Bot</div><div id="tgStatus" class="channel-status cs-inactive">● Not connected</div></div></div>
            </div>
            <div class="fg" style="margin-bottom:12px"><label>Bot Token</label><input id="tgToken" placeholder="123456:ABCdef..." type="password"/></div>
            <div class="fg" style="margin-bottom:12px"><label>Webhook URL (set via Telegram)</label>
              <div style="display:flex;gap:6px"><input id="tgWebhook" readonly style="font-size:11px;font-family:monospace"/><button class="btn btn-ghost" style="font-size:10px;padding:4px 8px;white-space:nowrap" onclick="copyField('tgWebhook')">Copy</button></div>
            </div>
            <button class="btn btn-cyan" style="width:100%;justify-content:center;margin-bottom:6px" onclick="saveTelegram()">💾 Save Telegram Config</button>
            <button class="btn btn-ghost" style="width:100%;justify-content:center;font-size:11px" onclick="registerTelegramWebhook()">🔗 Auto-register Webhook</button>
            <div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:8px;font-size:11px;color:var(--muted);line-height:1.8">
              <strong style="color:var(--text)">Setup:</strong><br>
              1. Talk to @BotFather → /newbot → get token<br>
              2. Paste token above → Save<br>
              3. Click "Auto-register Webhook" <span style="color:var(--green)">← easiest!</span><br>
              Or manually: <code style="color:var(--cyan)">setWebhook</code> API
            </div>
          </div>
          <!-- WhatsApp -->
          <div class="channel-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">💬</span><div><div style="font-size:14px;font-weight:700">WhatsApp Business</div><div id="waStatus" class="channel-status cs-inactive">● Not connected</div></div></div>
            </div>
            <div class="fg" style="margin-bottom:8px"><label>Access Token (System User)</label><input id="waToken" placeholder="EAAxxxxxxxxx..." type="password"/></div>
            <div class="fg" style="margin-bottom:8px"><label>Phone Number ID</label><input id="waPhoneId" placeholder="123456789012345"/></div>
            <div class="fg" style="margin-bottom:12px"><label>Verify Token (tự đặt)</label><input id="waVerify" placeholder="my_wa_verify_token"/></div>
            <div class="fg" style="margin-bottom:12px"><label>Webhook URL</label>
              <div style="display:flex;gap:6px"><input id="waWebhook" readonly style="font-size:11px;font-family:monospace"/><button class="btn btn-ghost" style="font-size:10px;padding:4px 8px;white-space:nowrap" onclick="copyField('waWebhook')">Copy</button></div>
            </div>
            <button class="btn btn-cyan" style="width:100%;justify-content:center" onclick="saveWhatsApp()">💾 Save WhatsApp Config</button>
            <div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:8px;font-size:11px;color:var(--muted);line-height:1.8">
              <strong style="color:var(--text)">Setup:</strong><br>
              1. developers.facebook.com → WhatsApp → API Setup<br>
              2. Get Access Token + Phone Number ID<br>
              3. Set Webhook URL + Verify Token<br>
              4. Subscribe: <code style="color:var(--cyan)">messages</code>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div class="card-hd-title">🧪 Test webhook</div></div>
          <div class="card-body">
            <div style="display:flex;gap:10px;align-items:center">
              <select id="testChannel" style="width:140px"><option value="web">Web Widget</option><option value="facebook">Facebook</option><option value="zalo">Zalo</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option></select>
              <input id="testMsg" placeholder="Nhập tin nhắn test..." style="flex:1"/>
              <button class="btn btn-purple" onclick="testReply()">🧪 Test</button>
            </div>
            <div id="testResult" style="margin-top:12px;display:none;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.6"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- BILLING -->
    <div class="page" id="page-billing">
      <div style="max-width:1000px">
        <div class="plan-grid" id="planGrid"></div>
        <div style="margin-bottom:16px">
          <div class="card">
            <div class="card-hd"><div class="card-hd-title">💳 Gói hiện tại</div></div>
            <div class="card-body" id="currentPlanInfo"><div class="empty">Đang tải...</div></div>
          </div>
        </div>
        <div class="card" id="intlPayCard" style="margin-bottom:16px;display:none">
          <div class="card-hd"><div class="card-hd-title">🌐 Thanh toán quốc tế</div></div>
          <div class="card-body" id="intlPayBody"><div class="empty">Đang tải...</div></div>
        </div>
        <div class="card">
          <div class="card-hd">
            <div class="card-hd-title">📋 Lịch sử đơn hàng</div>
            <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="loadBilling()">🔄 Làm mới</button>
          </div>
          <div style="padding:0">
            <table>
              <thead><tr>
                <th style="padding:12px 20px">Mã đơn</th>
                <th>Gói</th><th>Số tiền</th><th>Trạng thái</th>
                <th>Ngày tạo</th><th>Thanh toán lúc</th><th>Thao tác</th>
              </tr></thead>
              <tbody id="billingOrdersTb"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ĐƠN HÀNG (POS) -->
    <div class="page" id="page-orders">
      <div style="max-width:1040px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
          <div id="orderStats" style="display:flex;gap:10px;flex-wrap:wrap"></div>
          <button class="btn btn-cyan" onclick="openOrderModal()">🛒 Tạo đơn mới</button>
        </div>
        <div class="card">
          <div class="card-hd"><div class="card-hd-title">🧾 Danh sách đơn hàng</div>
            <button class="btn btn-ghost" style="font-size:11px;padding:5px 10px" onclick="loadOrders()">🔄 Làm mới</button>
          </div>
          <div style="padding:0;overflow-x:auto">
            <table>
              <thead><tr>
                <th style="padding:12px 20px">#</th><th>Khách</th><th>Sản phẩm</th><th>Tổng</th>
                <th>Trạng thái</th><th>Ngày</th><th>Thao tác</th>
              </tr></thead>
              <tbody id="ordersTb"><tr><td colspan="7" class="empty" style="padding:20px">Chưa có đơn nào</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- FUNNEL REPORT -->
    <div class="page" id="page-funnel">
      <div style="max-width:820px">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px" id="funnelStats"></div>
        <div style="display:grid;grid-template-columns:1fr 360px;gap:16px">
          <div class="card">
            <div class="card-hd">
              <div class="card-hd-title">📈 Phễu chuyển đổi</div>
              <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="loadFunnel()">🔄 Làm mới</button>
            </div>
            <div class="card-body" id="funnelViz"><div class="empty">Đang tải...</div></div>
          </div>
          <div>
            <div class="card" style="margin-bottom:14px">
              <div class="card-hd"><div class="card-hd-title">🔄 Transitions gần đây</div></div>
              <div class="card-body" id="funnelTransitions"><div class="empty">Đang tải...</div></div>
            </div>
            <div class="card">
              <div class="card-hd"><div class="card-hd-title">📊 Tỉ lệ chuyển đổi</div></div>
              <div class="card-body" id="funnelRates"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TEAM MANAGEMENT -->
    <div class="page" id="page-team">
      <div style="max-width:1060px">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px" id="teamStats"></div>
        <div style="display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:start">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="font-weight:700;font-size:13px">👥 Nhân viên</span>
              <button class="btn btn-ghost" style="font-size:11px;padding:4px 9px" onclick="loadTeam()">🔄</button>
            </div>
            <div id="teamList"></div>
            <div class="card" style="margin-top:12px">
              <div class="card-hd" style="cursor:pointer" onclick="var b=document.getElementById('addMemberBody');b.style.display=b.style.display==='none'?'block':'none'">
                <div class="card-hd-title">➕ Thêm nhân viên</div>
                <span style="color:var(--muted);font-size:12px">▾</span>
              </div>
              <div class="card-body" id="addMemberBody" style="display:none">
                <div class="fg" style="margin-bottom:8px"><label>Username</label><input id="newMemberUser" placeholder="nhanvien01"/></div>
                <div class="fg" style="margin-bottom:8px"><label>Mật khẩu</label><input id="newMemberPass" type="password" placeholder="••••••"/></div>
                <div class="fg" style="margin-bottom:12px"><label>Role</label>
                  <select id="newMemberRole">
                    <option value="agent">Agent (nhân viên sales)</option>
                    <option value="admin">Admin (toàn quyền)</option>
                  </select>
                </div>
                <button class="btn btn-cyan" style="width:100%;justify-content:center" onclick="addMember()">➕ Tạo tài khoản</button>
              </div>
            </div>
          </div>
          <div id="agentDetailWrap">
            <div style="display:flex;align-items:center;justify-content:center;min-height:280px;background:var(--s1);border:1px solid var(--border);border-radius:14px">
              <div style="text-align:center;color:var(--muted)">
                <div style="font-size:36px;margin-bottom:10px">👈</div>
                <div style="font-size:13px">Chọn nhân viên để xem chi tiết</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI CONFIG -->
    <div class="page" id="page-aiconfig">
      <div style="max-width:720px">
        <div style="padding:12px 16px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.3);border-radius:8px;font-size:12.5px;color:var(--muted);margin-bottom:18px">
          🧠 Khi không khớp từ khóa nào, bot sẽ gọi AI để trả lời tự nhiên như người thật. Hỗ trợ OpenAI và Google Gemini.
        </div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-hd"><div class="card-hd-title">🔑 Cấu hình AI Agent</div>
            <div style="display:flex;align-items:center;gap:8px">
              <span id="aiEnabledBadge" style="font-size:11px;padding:3px 10px;border-radius:20px;font-weight:700">Đang tắt</span>
              <button class="btn btn-cyan" style="font-size:11px;padding:5px 12px" onclick="saveAIConfig()">💾 Lưu</button>
            </div>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="fg"><label>Nhà cung cấp AI</label>
                <select id="aiProvider" onchange="updateAIModelHint()">
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              <div class="fg"><label>Model</label>
                <select id="aiModel">
                  <option value="gpt-4o-mini">gpt-4o-mini (rẻ, nhanh ⭐)</option>
                  <option value="gpt-4o">gpt-4o (chất lượng cao)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (khuyên dùng ⭐)</option>
                  <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (nhẹ, nhanh)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (chất lượng cao)</option>
                  <option value="gemini-flash-latest">gemini-flash-latest (luôn bản mới nhất)</option>
                </select>
              </div>
              <div class="fg full"><label>API Key</label><input id="aiApiKey" type="password" placeholder="sk-... (OpenAI) hoặc AIza... (Gemini)" oninput="onAIKeyInput()"/><div id="aiKeyHint" style="font-size:11px;margin-top:4px;color:var(--muted)"></div></div>
              <div class="fg full"><label>System Prompt (tuỳ chỉnh cách bot nói chuyện)</label>
                <textarea id="aiSystemPrompt" style="min-height:110px" placeholder="Để trống → dùng prompt mặc định (tự điền thông tin shop + sản phẩm)&#10;&#10;Ví dụ: Bạn là tư vấn viên của Shop ABC, chuyên bán đồ thể thao. Luôn gợi ý 1-2 sản phẩm phù hợp và hỏi size/màu sắc..."></textarea>
              </div>
              <div class="fg full" style="flex-direction:row;align-items:center;gap:10px">
                <input type="checkbox" id="aiEnabled" style="width:18px;height:18px;accent-color:var(--cyan)"/>
                <label style="text-transform:none;letter-spacing:0;font-size:13px;font-weight:500;color:var(--text)">Bật AI Agent (tự động trả lời khi không khớp keyword)</label>
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:16px">
          <div class="card-hd"><div class="card-hd-title">🧪 Test chatbot (giả làm khách)</div></div>
          <div class="card-body">
            <div style="padding:9px 12px;background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.25);border-radius:8px;font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.6">
              💡 Đây là chỗ <strong>xem trước bot trả lời KHÁCH</strong> thế nào (gõ như một khách hàng, vd "áo này bao nhiêu?"). <br>
              Muốn <strong>quản lý shop bằng giọng nói</strong> (thêm sản phẩm, tạo rule…) thì dùng <strong>Trợ lý 🤖</strong> ở góc phải dưới.
            </div>
            <div style="display:flex;gap:10px;margin-bottom:12px">
              <input id="aiTestMsg" placeholder="Giả làm khách hỏi, vd: áo này bao nhiêu?" style="flex:1" value="Cho mình hỏi sản phẩm nào bán chạy nhất?"/>
              <button class="btn btn-purple" onclick="testAI()">🧠 Hỏi thử</button>
            </div>
            <div id="aiTestResult" style="display:none;padding:14px;background:var(--bg);border:1px solid rgba(124,58,237,.3);border-radius:10px">
              <div style="font-size:10px;color:var(--muted);margin-bottom:6px">🤖 AI trả lời:</div>
              <div id="aiTestReply" style="font-size:13px;line-height:1.7;white-space:pre-wrap"></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-hd"><div class="card-hd-title">📊 Phân tích sắc thái tin nhắn</div></div>
          <div class="card-body" id="sentimentStats">
            <div class="empty">Đang tải...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- LEAD SCORING -->
    <div class="page" id="page-leads">
      <div style="max-width:900px">
        <div style="padding:12px 16px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:8px;font-size:12.5px;color:var(--muted);margin-bottom:18px">
          🎯 Hệ thống tự động chấm điểm khách hàng dựa trên hành vi nhắn tin. Đạt 80 điểm → tự chuyển sang <strong style="color:var(--pink)">Hot</strong>. Đạt 150 điểm → <strong style="color:var(--green)">Chốt</strong>.
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px" id="scoringStats"></div>
        <div class="card">
          <div class="card-hd">
            <div class="card-hd-title">🏆 Top Lead — Xếp hạng theo điểm</div>
            <button class="btn btn-ghost" style="font-size:11px;padding:5px 12px" onclick="loadLeads()">🔄 Làm mới</button>
          </div>
          <div class="card-body" style="padding:0">
            <table>
              <thead><tr>
                <th style="padding:12px 20px">Khách hàng</th>
                <th>Điểm</th>
                <th>Sắc thái</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th>Hành động</th>
              </tr></thead>
              <tbody id="leadsTb"></tbody>
            </table>
          </div>
        </div>
        <div style="margin-top:16px;padding:14px;background:var(--s2);border:1px solid var(--border);border-radius:12px;font-size:12px;color:var(--muted)">
          <strong style="color:var(--text)">Bảng điểm tự động:</strong>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">
            <div>📩 Gửi tin nhắn: <span style="color:var(--cyan)">+5</span></div>
            <div>💰 Hỏi giá: <span style="color:var(--cyan)">+15</span></div>
            <div>🛒 Muốn mua: <span style="color:var(--cyan)">+25</span></div>
            <div>📞 Cung cấp SĐT: <span style="color:var(--cyan)">+20</span></div>
            <div>🚚 Hỏi ship: <span style="color:var(--cyan)">+10</span></div>
            <div>📍 Hỏi địa chỉ: <span style="color:var(--cyan)">+10</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- SETTINGS -->
    <div class="page" id="page-settings">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:700px">
        <div class="card"><div class="card-hd"><div class="card-hd-title">🔐 Đổi mật khẩu</div></div>
          <div class="card-body"><div class="fg" style="margin-bottom:10px"><label>Mật khẩu cũ</label><input type="password" id="opw"/></div><div class="fg" style="margin-bottom:10px"><label>Mật khẩu mới</label><input type="password" id="npw"/></div><button class="btn btn-cyan" onclick="changePw()">Đổi mật khẩu</button></div>
        </div>
        <div class="card"><div class="card-hd"><div class="card-hd-title">📞 Liên hệ hỗ trợ</div></div>
          <div class="card-body" id="contactInfoCard">
            <div class="empty">Đang tải...</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<script src="/js/app.js"></script>
</body>
</html>

