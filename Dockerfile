const bcrypt = require('bcryptjs');
const { q, one, all } = require('../../db');

module.exports = function register(app, { auth, adminOnly, emit }) {

  // Danh sách + stats nhân viên
  app.get('/api/team', auth, adminOnly, async (req, res) => {
    try {
      const members = await all(
        'SELECT id, username, role, created_at FROM users WHERE shop_id=$1 ORDER BY id',
        [req.shopId]
      );
      for (const m of members) {
        const [cnt, closed, lastAct] = await Promise.all([
          one('SELECT COUNT(*) n FROM customer_assignments WHERE shop_id=$1 AND user_id=$2', [req.shopId, m.id]),
          one(`SELECT COUNT(*) n FROM customer_assignments ca JOIN customers c ON ca.customer_id=c.id
               WHERE ca.shop_id=$1 AND ca.user_id=$2 AND c.status='close'`, [req.shopId, m.id]),
          one('SELECT MAX(created_at) last FROM activity_log WHERE shop_id=$1 AND actor=$2', [req.shopId, m.username]),
        ]);
        m.assigned_count = +cnt.n;
        m.closed_count   = +closed.n;
        m.last_active    = lastAct?.last || null;
      }
      res.json(members);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Thêm nhân viên
  app.post('/api/team', auth, adminOnly, async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Thiếu username/password' });
      if (!['admin', 'agent'].includes(role))
        return res.status(400).json({ error: 'Role phải là admin hoặc agent' });
      const r = await one(
        'INSERT INTO users (shop_id,username,password,role) VALUES ($1,$2,$3,$4) RETURNING id',
        [req.shopId, username, bcrypt.hashSync(password, 10), role]
      );
      res.json({ id: r.id });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'Username đã tồn tại' });
      res.status(500).json({ error: e.message });
    }
  });

  // Xóa nhân viên
  app.delete('/api/team/:id', auth, adminOnly, async (req, res) => {
    try {
      if (+req.params.id === req.userId)
        return res.status(400).json({ error: 'Không thể xóa chính mình' });
      await q('DELETE FROM users WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Phân công KH cho agent
  app.post('/api/team/assign', auth, adminOnly, async (req, res) => {
    try {
      const { customer_id, user_id } = req.body;
      await q(
        'INSERT INTO customer_assignments (customer_id,user_id,shop_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [customer_id, user_id, req.shopId]
      );
      const cust = await one('SELECT name FROM customers WHERE id=$1', [customer_id]);
      await q('INSERT INTO activity_log (shop_id,customer_id,actor,action,detail) VALUES ($1,$2,$3,$4,$5)',
        [req.shopId, customer_id, 'admin', 'Chia KH cho nhân viên', `user_id=${user_id}`]);
      emit(req.shopId, 'customer:assigned', { customer_id, user_id, name: cust?.name });
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Hủy phân công
  app.delete('/api/team/assign/:customerId/:userId', auth, adminOnly, async (req, res) => {
    try {
      await q(
        'DELETE FROM customer_assignments WHERE customer_id=$1 AND user_id=$2 AND shop_id=$3',
        [req.params.customerId, req.params.userId, req.shopId]
      );
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Danh sách KH của 1 agent
  app.get('/api/team/:id/customers', auth, adminOnly, async (req, res) => {
    try {
      const rows = await all(
        `SELECT c.id, c.name, c.phone, c.status, c.score, c.sentiment, ca.assigned_at
         FROM customers c JOIN customer_assignments ca ON c.id=ca.customer_id
         WHERE ca.shop_id=$1 AND ca.user_id=$2 ORDER BY ca.assigned_at DESC`,
        [req.shopId, req.params.id]
      );
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Đổi role
  app.put('/api/team/:id/role', auth, adminOnly, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['admin', 'agent'].includes(role))
        return res.status(400).json({ error: 'Role không hợp lệ' });
      if (+req.params.id === req.userId)
        return res.status(400).json({ error: 'Không thể đổi role chính mình' });
      await q('UPDATE users SET role=$1 WHERE id=$2 AND shop_id=$3', [role, req.params.id, req.shopId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Reset mật khẩu nhân viên
  app.put('/api/team/:id/reset-password', auth, adminOnly, async (req, res) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 4)
        return res.status(400).json({ error: 'Mật khẩu phải từ 4 ký tự' });
      await q('UPDATE users SET password=$1 WHERE id=$2 AND shop_id=$3',
        [bcrypt.hashSync(password, 10), req.params.id, req.shopId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Bulk assign
  app.post('/api/team/bulk-assign', auth, adminOnly, async (req, res) => {
    try {
      const { user_id, customer_ids } = req.body;
      if (!user_id || !Array.isArray(customer_ids) || !customer_ids.length)
        return res.status(400).json({ error: 'Thiếu user_id hoặc customer_ids' });
      let assigned = 0;
      for (const cid of customer_ids) {
        const r = await q(
          'INSERT INTO customer_assignments (customer_id,user_id,shop_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
          [cid, user_id, req.shopId]
        );
        if (r.rowCount > 0) {
          assigned++;
          await q('INSERT INTO activity_log (shop_id,customer_id,actor,action,detail) VALUES ($1,$2,$3,$4,$5)',
            [req.shopId, cid, 'admin', 'Chia KH cho nhân viên', `user_id=${user_id}`]);
        }
      }
      const agent = await one('SELECT username FROM users WHERE id=$1', [user_id]);
      emit(req.shopId, 'customer:assigned', { user_id, count: assigned, username: agent?.username });
      res.json({ ok: true, assigned });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
