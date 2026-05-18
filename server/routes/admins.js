const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAdmin, requireSuperAdmin, JWT_SECRET } = require('../middleware/auth');

// GET /api/admins — list all admins (superadmin only)
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role, created_at FROM admins ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admins — create admin (superadmin only)
router.post('/', requireSuperAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' });
  if (password.length < 6)
    return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });

  try {
    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
      [username.trim(), hash, 'admin']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'שם משתמש כבר קיים' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admins/:id — edit any admin (superadmin only)
router.put('/:id', requireSuperAdmin, async (req, res) => {
  const { username, password } = req.body;
  const targetId = req.params.id;

  try {
    const { rows: existing } = await pool.query('SELECT * FROM admins WHERE id = $1', [targetId]);
    if (!existing[0]) return res.status(404).json({ error: 'משתמש לא נמצא' });

    const newUsername = username ? username.trim() : existing[0].username;
    const newHash = password ? bcrypt.hashSync(password, 10) : existing[0].password_hash;

    const { rows } = await pool.query(
      'UPDATE admins SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username, role, created_at',
      [newUsername, newHash, targetId]
    );

    // If editing self, return new token
    if (Number(targetId) === req.admin.id) {
      const token = jwt.sign(
        { id: rows[0].id, username: rows[0].username, role: rows[0].role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ admin: rows[0], token });
    }

    res.json({ admin: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'שם משתמש כבר קיים' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admins/:id — delete admin (superadmin only, cannot delete self)
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  if (Number(req.params.id) === req.admin.id)
    return res.status(400).json({ error: 'לא ניתן למחוק את עצמך' });

  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'משתמש לא נמצא' });
    if (rows[0].role === 'superadmin')
      return res.status(400).json({ error: 'לא ניתן למחוק סופר אדמין' });

    await pool.query('DELETE FROM admins WHERE id = $1', [req.params.id]);
    res.json({ message: 'המשתמש נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admins/me — edit own username/password (any admin)
router.put('/me/profile', requireAdmin, async (req, res) => {
  const { username, current_password, new_password } = req.body;
  if (!current_password)
    return res.status(400).json({ error: 'נדרשת סיסמה נוכחית לאישור' });

  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const admin = rows[0];

    const valid = bcrypt.compareSync(current_password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'הסיסמה הנוכחית שגויה' });

    const newUsername = username ? username.trim() : admin.username;
    const newHash = new_password ? bcrypt.hashSync(new_password, 10) : admin.password_hash;

    if (new_password && new_password.length < 6)
      return res.status(400).json({ error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' });

    const { rows: updated } = await pool.query(
      'UPDATE admins SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username, role, created_at',
      [newUsername, newHash, admin.id]
    );

    const token = jwt.sign(
      { id: updated[0].id, username: updated[0].username, role: updated[0].role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ admin: updated[0], token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'שם משתמש כבר קיים' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
