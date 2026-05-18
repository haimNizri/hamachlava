const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAdmin, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, admin: { id: admin.id, username: admin.username } });
});

// GET /api/auth/verify
router.get('/verify', requireAdmin, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

module.exports = router;
