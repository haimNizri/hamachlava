const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin, requireAdminOrCustomer } = require('../middleware/auth');

router.get('/events/:id/purchases', requireAdmin, async (req, res) => {
  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });

    const { rows } = await pool.query(`
      SELECT pu.*, p.name as product_name, p.price as product_price
      FROM purchases pu
      JOIN products p ON p.id = pu.product_id
      WHERE pu.event_id = $1
      ORDER BY pu.created_at DESC
    `, [ev[0].id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdminOrCustomer, async (req, res) => {
  const { event_id, product_id, quantity, customer_name, customer_id: bodyCustomerId, session_id } = req.body;
  if (!event_id || !product_id || !quantity)
    return res.status(400).json({ error: 'נדרש: event_id, product_id, quantity' });

  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });

    const { rows: pr } = await pool.query('SELECT * FROM products WHERE id = $1 AND event_id = $2', [product_id, event_id]);
    if (!pr[0]) return res.status(404).json({ error: 'מוצר לא נמצא' });

    const total_price = pr[0].price * quantity;
    let added_by = 'customer';
    let finalCustomerName = customer_name;
    let customer_id = null;

    if (req.admin) {
      added_by = 'admin';
      finalCustomerName = customer_name || 'מנהל';
      if (bodyCustomerId) customer_id = Number(bodyCustomerId);
    } else if (req.customer) {
      customer_id = req.customer.id;
      finalCustomerName = `${req.customer.firstName} ${req.customer.lastName}`;
    }

    const { rows } = await pool.query(`
      INSERT INTO purchases (event_id, customer_id, customer_name, product_id, quantity, total_price, added_by, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [event_id, customer_id, finalCustomerName, product_id, quantity, total_price, added_by, session_id || null]);

    const { rows: full } = await pool.query(`
      SELECT pu.*, p.name as product_name
      FROM purchases pu JOIN products p ON p.id = pu.product_id
      WHERE pu.id = $1
    `, [rows[0].id]);

    res.status(201).json(full[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { customer_name, quantity } = req.body;
  try {
    const { rows: existing } = await pool.query(
      'SELECT pu.*, p.price FROM purchases pu JOIN products p ON p.id = pu.product_id WHERE pu.id = $1',
      [req.params.id]
    );
    if (!existing[0]) return res.status(404).json({ error: 'רכישה לא נמצאה' });
    const p = existing[0];
    const newQty = quantity !== undefined ? Number(quantity) : p.quantity;
    const newName = customer_name !== undefined ? customer_name : p.customer_name;
    const total_price = p.price * newQty;
    const { rows } = await pool.query(
      'UPDATE purchases SET customer_name=$1, quantity=$2, total_price=$3 WHERE id=$4 RETURNING *',
      [newName, newQty, total_price, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM purchases WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'רכישה לא נמצאה' });

    await pool.query('DELETE FROM purchases WHERE id = $1', [rows[0].id]);
    res.json({ message: 'הרכישה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
