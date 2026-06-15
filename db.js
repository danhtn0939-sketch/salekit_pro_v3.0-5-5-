const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { q, one, all } = require('../../db');

module.exports = function register(app, { auth, adminOnly, customerAuth, customerGuard }) {

  // Đăng nhập khách hàng (bằng SĐT + password) — dùng chung guard luỹ tiến bên khách
  app.post('/api/portal/login', customerGuard.middleware, async (req, res) => {
    try {
      const { shopId, phone, password } = req.body;
      if (!shopId || !phone || !password)
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
      const cust = await one(
        'SELECT * FROM customers WHERE shop_id=$1 AND phone=$2 AND portal_password IS NOT NULL',
        [shopId, phone.trim()]
      );
      if (!cust || !bcrypt.compareSync(password, cust.portal_password)) {
        customerGuard.fail(req);
        return res.status(401).json({ error: 'Sai thông tin đăng nhập' });
      }
      customerGuard.success(req);
      const token = jwt.sign(
        { customerId: cust.id, shopId, role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      const shop = await one('SELECT name FROM shops WHERE id=$1', [shopId]);
      res.json({
        token,
        customer: { id: cust.id, name: cust.name, phone: cust.phone, email: cust.email, status: cust.status, score: cust.score },
        shop: { id: shopId, name: shop?.name },
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Admin cấp mật khẩu portal cho khách hàng
  app.put('/api/customers/:id/portal-password', auth, adminOnly, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 4)
        return res.status(400).json({ error: 'Mật khẩu phải từ 4 ký tự' });
      await q(
        'UPDATE customers SET portal_password=$1 WHERE id=$2 AND shop_id=$3',
        [bcrypt.hashSync(password, 10), req.params.id, req.shopId]
      );
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Khách hàng xem thông tin + tin nhắn của mình
  app.get('/api/portal/me', customerAuth, async (req, res) => {
    try {
      const cust = await one(
        'SELECT id,name,phone,email,source,product,status,score,sentiment,created_at FROM customers WHERE id=$1 AND shop_id=$2',
        [req.customerId, req.shopId]
      );
      const msgs = await all(
        'SELECT direction,text,ai_reply,staff_reply,created_at,sentiment FROM messages WHERE customer_id=$1 AND shop_id=$2 ORDER BY created_at ASC',
        [req.customerId, req.shopId]
      );
      const shop     = await one('SELECT name FROM shops WHERE id=$1', [req.shopId]);
      const assigned = await all(
        'SELECT u.username,u.role FROM users u JOIN customer_assignments ca ON u.id=ca.user_id WHERE ca.customer_id=$1 AND ca.shop_id=$2',
        [req.customerId, req.shopId]
      );
      res.json({ customer: cust, messages: msgs, shop, assigned });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
