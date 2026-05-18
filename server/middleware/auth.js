const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hamachlava-secret-key-2024';

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'אין הרשאה - נדרשת התחברות' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'אין הרשאת מנהל' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

function requireCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'אין הרשאה' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'אין הרשאת לקוח' });
    }
    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

function requireAdminOrCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'אין הרשאה' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'admin') {
      req.admin = decoded;
    } else if (decoded.role === 'customer') {
      req.customer = decoded;
    } else {
      return res.status(403).json({ error: 'אין הרשאה' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }
}

module.exports = { requireAdmin, requireCustomer, requireAdminOrCustomer, JWT_SECRET };
