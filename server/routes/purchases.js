const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin, requireAdminOrCustomer } = require('../middleware/auth');

// GET /api/events/:id/purchases
router.get('/events/:id/purchases', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const purchases = db.prepare(`
    SELECT pu.*, p.name as product_name, p.price as product_price
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    WHERE pu.event_id = ?
    ORDER BY pu.created_at DESC
  `).all(event.id);

  res.json(purchases);
});

// POST /api/purchases
router.post('/', requireAdminOrCustomer, (req, res) => {
  const { event_id, product_id, quantity, customer_name, session_id } = req.body;

  if (!event_id || !product_id || !quantity) {
    return res.status(400).json({ error: 'נדרש: event_id, product_id, quantity' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND event_id = ?').get(product_id, event_id);
  if (!product) return res.status(404).json({ error: 'מוצר לא נמצא' });

  const total_price = product.price * quantity;
  let added_by = 'customer';
  let finalCustomerName = customer_name;
  let customer_id = null;

  if (req.admin) {
    added_by = 'admin';
    finalCustomerName = customer_name || 'מנהל';
  } else if (req.customer) {
    added_by = 'customer';
    customer_id = req.customer.id;
    finalCustomerName = `${req.customer.firstName} ${req.customer.lastName}`;
  }

  const result = db.prepare(`
    INSERT INTO purchases (event_id, customer_id, customer_name, product_id, quantity, total_price, added_by, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(event_id, customer_id, finalCustomerName, product_id, quantity, total_price, added_by, session_id || null);

  const purchase = db.prepare(`
    SELECT pu.*, p.name as product_name
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    WHERE pu.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(purchase);
});

// DELETE /api/purchases/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id);
  if (!purchase) return res.status(404).json({ error: 'רכישה לא נמצאה' });

  db.prepare('DELETE FROM purchases WHERE id = ?').run(purchase.id);
  res.json({ message: 'הרכישה נמחקה בהצלחה' });
});

module.exports = router;
