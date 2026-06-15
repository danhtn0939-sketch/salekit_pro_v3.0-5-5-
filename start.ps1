# ═══════════════════════════════════════════════════════
#  SalesKit Pro — Start Script
#  Chạy: .\start.ps1
# ═══════════════════════════════════════════════════════

$env:PATH = "C:\Program Files\PostgreSQL\16\bin;C:\nvm4w\nodejs;C:\Users\Doanh\AppData\Local\nvm;" + $env:PATH
$env:PGPASSWORD = "postgres"

Write-Host "`n🚀 Khởi động SalesKit Pro..." -ForegroundColor Cyan

# Kill process cũ nếu có
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Khởi động Node.js backend
$script = Split-Path -Parent $MyInvocation.MyCommand.Definition
$proc = Start-Process -FilePath "C:\nvm4w\nodejs\node.exe" -ArgumentList "server.js" `
  -WorkingDirectory $script -PassThru
Write-Host "✅ Backend chạy tại: http://localhost:4000  (PID: $($proc.Id))" -ForegroundColor Green

Start-Sleep 1

# Kiểm tra server OK
try {
  $health = Invoke-RestMethod "http://localhost:4000" -TimeoutSec 5
  Write-Host "✅ Database: $($health.db) · Shops: $($health.shops)" -ForegroundColor Green
} catch {
  Write-Host "⚠️  Server chưa sẵn sàng" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 THÔNG TIN ĐĂNG NHẬP:" -ForegroundColor Yellow
Write-Host "   Shop ID:  demo-shop"
Write-Host "   Username: admin"
Write-Host "   Password: 1234"
Write-Host ""
Write-Host "🌐 ĐỂ KẾT NỐI FB/ZALO (cần public URL):" -ForegroundColor Yellow
Write-Host "   1. Đăng ký miễn phí tại: https://ngrok.com"
Write-Host "   2. Chạy lệnh: ngrok config add-authtoken YOUR_TOKEN"
Write-Host "   3. Chạy lệnh: ngrok http 4000"
Write-Host "   4. Copy URL HTTPS → dán vào trang Channels trong dashboard"
Write-Host ""
Write-Host "🧪 TEST KHÔNG CẦN FB THẬT:" -ForegroundColor Cyan
Write-Host "   Mở dashboard → 📬 Hộp thư → 🧪 Simulate Tool"
Write-Host "   Chọn kênh (Facebook/Zalo/Web) → gõ tin → ▶ Gửi"
Write-Host "   Xem notification real-time ngay lập tức!"
Write-Host ""

# Mở dashboard
Start-Process "$script\..\..\saleskit-pro.html"
Write-Host "✅ Dashboard đã mở trong trình duyệt" -ForegroundColor Green
Write-Host ""
Write-Host "Nhấn Ctrl+C để dừng server..." -ForegroundColor DarkGray

# Giữ terminal mở
$proc.WaitForExit()
