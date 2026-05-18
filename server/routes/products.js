const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// POST /api/events/:id/products
router.post('/events/:id/products', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const { name, price, available_quantity } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'שם ומחיר נדרשים' });
  }

  const result = db.prepare(
    'INSERT INTO products (event_id, name, price, available_quantity) VALUES (?, ?, ?, ?)'
  ).run(event.id, name, price, available_quantity || null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PUT /api/products/:id
router.put('/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'מוצר לא נמצא' });

  const { name, price, available_quantity } = req.body;

  db.prepare(`
    UPDATE products SET name = ?, price = ?, available_quantity = ? WHERE id = ?
  `).run(
    name || product.name,
    price !== undefined ? price : product.price,
    available_quantity !== undefined ? available_quantity : product.available_quantity,
    product.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json(updated);
});

// DELETE /api/products/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'מוצר לא נמצא' });

  db.prepare('DELETE FROM purchases WHERE product_id = ?').run(product.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(product.id);

  res.json({ message: 'המוצר נמחק בהצלחה' });
});

module.exports = router;
