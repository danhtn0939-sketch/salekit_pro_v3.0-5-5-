const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Thiếu token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.shopId = payload.shopId;
    req.userId = payload.userId;
    req.role   = payload.role || 'admin';
    next();
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

function adminOnly(req, res, next) {
  if (req.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền này' });
  next();
}

function superAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Thiếu token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'superadmin') return res.status(403).json({ error: 'Không có quyền' });
    next();
  } catch { res.status(401).json({ error: 'Token không hợp lệ' }); }
}

function customerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Thiếu token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'customer') return res.status(403).json({ error: 'Không có quyền' });
    req.customerId = payload.customerId;
    req.shopId     = payload.shopId;
    next();
  } catch { res.status(401).json({ error: 'Token không hợp lệ' }); }
}

module.exports = { auth, adminOnly, superAuth, customerAuth };
