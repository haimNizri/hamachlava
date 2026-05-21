const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { device_id, first_name, last_name } = req.body;
  if (!device_id || !first_name || !last_name)
    return res.status(400).json({ error: 'כל השדות נדרשים' });

  try {
    let { rows } = await pool.query('SELECT * FROM customers WHERE device_id = $1', [device_id]);
    let customer = rows[0];

    if (!customer) {
      const insert = await pool.query(
        'INSERT INTO customers (device_id, first_name, last_name) VALUES ($1, $2, $3) RETURNING *',
        [device_id, first_name.trim(), last_name.trim()]
      );
      customer = insert.rows[0];
    }

    const token = jwt.sign(
      { id: customer.id, device_id, role: 'customer', firstName: customer.first_name, lastName: customer.last_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ customer, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all customers (admin)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, first_name, last_name FROM customers ORDER BY first_name, last_name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search customers by name (admin only)
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name
       FROM customers
       WHERE CONCAT(first_name, ' ', last_name) ILIKE $1
       ORDER BY first_name, last_name
       LIMIT 10`,
      [`%${q.trim()}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check/:deviceId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE device_id = $1', [req.params.deviceId]);
    if (rows[0]) res.json({ registered: true, customer: rows[0] });
    else res.json({ registered: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE purchases SET customer_id = NULL WHERE customer_id = $1', [req.params.id]);
    await client.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ message: 'הלקוח נמחק' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
