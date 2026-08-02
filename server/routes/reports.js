const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Format a timestamp to a YYYY-MM-DD key in Israel local time
function dayKey(ts) {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

// GET /api/reports/monthly?month=YYYY-MM
// Per-customer charges for the given month, with a per-product breakdown.
// Also returns the list of months that have any purchases (for the picker).
router.get('/monthly', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pu.customer_id, pu.customer_name, pu.quantity, pu.total_price, pu.created_at,
             p.name AS product_name,
             c.first_name, c.last_name
      FROM purchases pu
      JOIN products p ON p.id = pu.product_id
      LEFT JOIN customers c ON c.id = pu.customer_id
      ORDER BY pu.created_at DESC
    `);

    const monthsSet = new Set();
    for (const r of rows) monthsSet.add(dayKey(r.created_at).slice(0, 7));
    const months = [...monthsSet].sort().reverse();

    const month = req.query.month || months[0] || dayKey(new Date()).slice(0, 7);

    // customerKey -> aggregate
    const custMap = new Map();
    let grandTotal = 0;
    let grandItems = 0;

    for (const r of rows) {
      if (dayKey(r.created_at).slice(0, 7) !== month) continue;

      const displayName = (r.first_name || r.last_name)
        ? `${r.first_name || ''} ${r.last_name || ''}`.trim()
        : (r.customer_name || 'אנונימי');
      const key = r.customer_id != null ? `id:${r.customer_id}` : `name:${displayName}`;
      const price = Number(r.total_price) || 0;

      grandTotal += price;
      grandItems += r.quantity;

      if (!custMap.has(key)) {
        custMap.set(key, {
          customer_id: r.customer_id ?? null,
          name: displayName,
          total: 0,
          item_count: 0,
          products: new Map()  // product_name -> { quantity, total }
        });
      }
      const c = custMap.get(key);
      c.total += price;
      c.item_count += r.quantity;

      if (!c.products.has(r.product_name)) c.products.set(r.product_name, { product_name: r.product_name, quantity: 0, total: 0 });
      const pAgg = c.products.get(r.product_name);
      pAgg.quantity += r.quantity;
      pAgg.total += price;
    }

    const customers = [...custMap.values()]
      .map(c => ({ ...c, products: [...c.products.values()] }))
      .sort((a, b) => b.total - a.total);

    res.json({ month, months, customers, grandTotal, grandItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
