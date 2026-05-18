const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hamachlava-secret-key-2024';

function requireAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'אין הרשאה - נדרשת התחברות' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin')
      return res.status(403).json({ error: 'אין הרשאת מנהל' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

function requireSuperAdmin(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'אין הרשאה' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'superadmin')
      return res.status(403).json({ error: 'פעולה זו מותרת לסופר אדמין בלבד' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

function requireCustomer(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'אין הרשאה' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'customer')
      return res.status(403).json({ error: 'אין הרשאת לקוח' });
    req.customer = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

function requireAdminOrCustomer(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'אין הרשאה' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin' || decoded.role === 'superadmin') req.admin = decoded;
    else if (decoded.role === 'customer') req.customer = decoded;
    else return res.status(403).json({ error: 'אין הרשאה' });
    next();
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

function extractToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.split(' ')[1];
}

module.exports = { requireAdmin, requireSuperAdmin, requireCustomer, requireAdminOrCustomer, JWT_SECRET };
