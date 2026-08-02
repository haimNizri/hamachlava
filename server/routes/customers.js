const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET, requireCustomer } = require('../middleware/auth');

// Format a timestamp to a YYYY-MM-DD key in Israel local time
function dayKey(ts) {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

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

// GET /api/customers/me/charges — logged-in customer's own daily & monthly charges
router.get('/me/charges', requireCustomer, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pu.id, pu.quantity, pu.total_price, pu.created_at, pu.payment_method,
             p.name AS product_name,
             e.name AS event_name
      FROM purchases pu
      JOIN products p ON p.id = pu.product_id
      LEFT JOIN events e ON e.id = pu.event_id
      WHERE pu.customer_id = $1
      ORDER BY pu.created_at DESC
    `, [req.customer.id]);

    const monthlyMap = new Map();  // 'YYYY-MM' -> { month, total, count }
    const dailyMap = new Map();    // 'YYYY-MM-DD' -> { date, total, items: [] }
    let grandTotal = 0;

    for (const r of rows) {
      const price = Number(r.total_price) || 0;
      grandTotal += price;

      const day = dayKey(r.created_at);
      const month = day.slice(0, 7);

      if (!monthlyMap.has(month)) monthlyMap.set(month, { month, total: 0, count: 0 });
      const m = monthlyMap.get(month);
      m.total += price;
      m.count += r.quantity;

      if (!dailyMap.has(day)) dailyMap.set(day, { date: day, total: 0, items: [] });
      const d = dailyMap.get(day);
      d.total += price;
      d.items.push({
        product_name: r.product_name,
        event_name: r.event_name,
        quantity: r.quantity,
        total_price: price,
        payment_method: r.payment_method,
        created_at: r.created_at
      });
    }

    // Maps preserve insertion order; rows are already newest-first
    res.json({
      grandTotal,
      monthly: [...monthlyMap.values()],
      daily: [...dailyMap.values()]
    });
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
