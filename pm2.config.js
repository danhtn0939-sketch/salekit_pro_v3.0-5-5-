/**
 * PM2 Cluster Config — SalesKit Pro v3.0
 *
 * Khởi động: pm2 start pm2.config.js
 * Xem logs:  pm2 logs saleskit-pro
 * Reload:    pm2 reload saleskit-pro   (zero-downtime)
 * Stop:      pm2 stop saleskit-pro
 *
 * Lưu ý: Socket.IO multi-process cần thêm Redis adapter để sticky session.
 * Cho <= 300 shops thì single instance (instances: 1) là đủ.
 * Bật cluster (instances: 'max') khi cần scale 1000+ shops.
 */
module.exports = {
  apps: [
    {
      name: 'saleskit-pro',

      script: 'server.js',

      // ── SINGLE INSTANCE (khuyến nghị cho <= 300 shops) ──────────────
      // Socket.IO không cần Redis adapter khi chỉ 1 process.
      instances: 1,
      exec_mode: 'fork',

      // ── CLUSTER MODE (bật khi scale 1000+ shops) ────────────────────
      // Bỏ comment 2 dòng dưới và comment 2 dòng trên
      // instances: 'max',   // dùng hết CPU cores
      // exec_mode: 'cluster',
      // + Thêm Redis adapter: npm install @socket.io/redis-adapter ioredis
      //   rồi cấu hình REDIS_URL trong .env

      // ── AUTO-RESTART ────────────────────────────────────────────────
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,

      // ── MEMORY GUARD ────────────────────────────────────────────────
      // Tự restart nếu RAM vượt 512MB (dấu hiệu memory leak)
      max_memory_restart: '512M',

      // ── ENV PRODUCTION ──────────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      // ── LOGGING ────────────────────────────────────────────────────
      out_file:   './logs/pm2-out.log',
      error_file: './logs/pm2-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
