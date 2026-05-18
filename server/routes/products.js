const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.post('/events/:id/products', requireAdmin, async (req, res) => {
  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });

    const { name, price, available_quantity } = req.body;
    if (!name || price === undefined)
      return res.status(400).json({ error: 'שם ומחיר נדרשים' });

    const { rows } = await pool.query(
      'INSERT INTO products (event_id, name, price, available_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [ev[0].id, name, price, available_quantity || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: pr } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!pr[0]) return res.status(404).json({ error: 'מוצר לא נמצא' });
    const p = pr[0];

    const { name, price, available_quantity } = req.body;
    const { rows } = await pool.query(
      'UPDATE products SET name = $1, price = $2, available_quantity = $3 WHERE id = $4 RETURNING *',
      [name || p.name, price !== undefined ? price : p.price, available_quantity !== undefined ? available_quantity : p.available_quantity, p.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'מוצר לא נמצא' });

    await pool.query('DELETE FROM purchases WHERE product_id = $1', [rows[0].id]);
    await pool.query('DELETE FROM products WHERE id = $1', [rows[0].id]);
    res.json({ message: 'המוצר נמחק בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
