/**
 * orders.js — Đơn hàng (POS) + trừ/hoàn kho tự động.
 */
const { q, one, all } = require('../../db');

// "299.000" / "299000đ" → 299000
const toNum = v => { const n = parseInt(String(v == null ? '' : v).replace(/[^\d]/g, ''), 10); return isNaN(n) ? 0 : n; };

module.exports = function register(app, { auth, emit }) {

  // Danh sách đơn
  app.get('/api/orders', auth, async (req, res) => {
    try {
      const rows = await all('SELECT * FROM orders WHERE shop_id=$1 ORDER BY id DESC LIMIT 200', [req.shopId]);
      res.json(rows.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })));
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Tạo đơn → trừ kho
  app.post('/api/orders', auth, async (req, res) => {
    try {
      const { customer_id, customer_name, phone, address, items, note, channel } = req.body;
      if (!Array.isArray(items) || !items.length)
        return res.status(400).json({ error: 'Đơn chưa có sản phẩm nào' });

      const clean = items.map(it => ({
        product_id: it.product_id || null,
        name: String(it.name || '').slice(0, 120),
        price: toNum(it.price),
        qty: Math.max(1, parseInt(it.qty, 10) || 1),
      }));
      const total = clean.reduce((s, it) => s + it.price * it.qty, 0);

      const r = await one(
        `INSERT INTO orders (shop_id,customer_id,customer_name,phone,address,items,total,note,channel,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'new') RETURNING id, created_at`,
        [req.shopId, customer_id || null, customer_name || '', phone || '', address || '',
         JSON.stringify(clean), total, note || '', channel || 'manual']
      );

      // Trừ kho từng sản phẩm
      for (const it of clean)
        if (it.product_id)
          await q('UPDATE products SET stock = COALESCE(stock,0) - $1 WHERE id=$2 AND shop_id=$3',
            [it.qty, it.product_id, req.shopId]);

      if (customer_id)
        await q('INSERT INTO activity_log (shop_id,customer_id,actor,action,detail) VALUES ($1,$2,$3,$4,$5)',
          [req.shopId, customer_id, 'staff', 'Tạo đơn hàng', `Tổng: ${total.toLocaleString('vi-VN')}đ`]);

      emit(req.shopId, 'order:new', { id: r.id, total, customer_name: customer_name || '' });
      res.json({ id: r.id, total, created_at: r.created_at });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Đổi trạng thái (huỷ đơn → hoàn kho)
  app.put('/api/orders/:id/status', auth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['new', 'confirmed', 'shipping', 'done', 'cancelled'].includes(status))
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });

      if (status === 'cancelled') {
        const o = await one('SELECT items, status FROM orders WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
        if (o && o.status !== 'cancelled')
          for (const it of JSON.parse(o.items || '[]'))
            if (it.product_id)
              await q('UPDATE products SET stock = COALESCE(stock,0) + $1 WHERE id=$2 AND shop_id=$3',
                [it.qty, it.product_id, req.shopId]);
      }
      await q('UPDATE orders SET status=$1 WHERE id=$2 AND shop_id=$3', [status, req.params.id, req.shopId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/orders/:id', auth, async (req, res) => {
    try {
      await q('DELETE FROM orders WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId]);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
};
