const PLANS = {
  free:       { label: 'Free',       price: 0,       price_usd: 0,   customers: 100,  products: 10,  rules: 5 },
  basic:      { label: 'Basic',      price: 299000,  price_usd: 12,  customers: 500,  products: 50,  rules: 30 },
  pro:        { label: 'Pro',        price: 699000,  price_usd: 28,  customers: 5000, products: 200, rules: 100 },
  enterprise: { label: 'Enterprise', price: 1999000, price_usd: 80,  customers: -1,   products: -1,  rules: -1 },
};

const RESOURCE_LABEL = { customers: 'khách hàng', products: 'sản phẩm', rules: 'auto-reply rule' };
const RESOURCE_TABLE = { customers: 'customers',  products: 'products',  rules: 'rules' };

const { all } = require('../db');

// Tính giá sau giảm + chuẩn hoá 1 gói
function withFinal(p) {
  const d = Math.max(0, Math.min(100, +p.discount_pct || 0));
  return {
    label: p.label, price: +p.price, price_usd: +p.price_usd,
    customers: +p.customers, products: +p.products, rules: +p.rules,
    discount_pct: d,
    price_final:     d > 0 ? Math.round(+p.price * (1 - d / 100))     : +p.price,
    price_usd_final: d > 0 ? Math.round(+p.price_usd * (1 - d / 100)) : +p.price_usd,
  };
}

// Lấy gói động từ DB (chủ app đã chỉnh); fallback về PLANS mặc định nếu lỗi.
async function getPlans() {
  try {
    const rows = await all('SELECT * FROM plans ORDER BY sort_order, price');
    if (!rows.length) throw new Error('empty');
    const out = {};
    for (const r of rows) out[r.id] = withFinal(r);
    return out;
  } catch {
    const out = {};
    for (const k of Object.keys(PLANS)) out[k] = withFinal({ ...PLANS[k], discount_pct: 0 });
    return out;
  }
}

module.exports = { PLANS, RESOURCE_LABEL, RESOURCE_TABLE, getPlans };
