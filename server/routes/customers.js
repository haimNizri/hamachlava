const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/customers/register
router.post('/register', (req, res) => {
  const { device_id, first_name, last_name } = req.body;

  if (!device_id || !first_name || !last_name) {
    return res.status(400).json({ error: 'כל השדות נדרשים' });
  }

  // Check if already registered
  let customer = db.prepare('SELECT * FROM customers WHERE device_id = ?').get(device_id);

  if (customer) {
    // Already registered, just return token
    const token = jwt.sign(
      { id: customer.id, device_id, role: 'customer', firstName: customer.first_name, lastName: customer.last_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    return res.json({ customer, token });
  }

  // Register new customer
  const result = db.prepare(
    'INSERT INTO customers (device_id, first_name, last_name) VALUES (?, ?, ?)'
  ).run(device_id, first_name.trim(), last_name.trim());

  customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

  const token = jwt.sign(
    { id: customer.id, device_id, role: 'customer', firstName: customer.first_name, lastName: customer.last_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({ customer, token });
});

// GET /api/customers/check/:deviceId
router.get('/check/:deviceId', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE device_id = ?').get(req.params.deviceId);
  if (customer) {
    res.json({ registered: true, customer });
  } else {
    res.json({ registered: false });
  }
});

module.exports = router;
