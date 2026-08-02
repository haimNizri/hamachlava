const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Format a timestamp to a YYYY-MM-DD key in Israel local time
function dayKey(ts) {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

// Load all purchases (joined with product/customer) newest-first.
async function loadPurchases() {
  const { rows } = await pool.query(`
    SELECT pu.customer_id, pu.customer_name, pu.quantity, pu.total_price, pu.created_at,
           p.name AS product_name,
           c.first_name, c.last_name
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    LEFT JOIN customers c ON c.id = pu.customer_id
    ORDER BY pu.created_at DESC
  `);
  return rows;
}

// Aggregate purchases into per-customer monthly charges for the requested month.
function aggregateMonthly(rows, requestedMonth) {
  const monthsSet = new Set();
  for (const r of rows) monthsSet.add(dayKey(r.created_at).slice(0, 7));
  const months = [...monthsSet].sort().reverse();

  const month = requestedMonth || months[0] || dayKey(new Date()).slice(0, 7);

  const custMap = new Map(); // customerKey -> aggregate
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

  return { month, months, customers, grandTotal, grandItems };
}

function styleHeader(row, argb) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

// GET /api/reports/monthly?month=YYYY-MM
// Per-customer charges for the given month, with a per-product breakdown.
// Also returns the list of months that have any purchases (for the picker).
router.get('/monthly', requireAdmin, async (req, res) => {
  try {
    const rows = await loadPurchases();
    res.json(aggregateMonthly(rows, req.query.month));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/monthly/export?month=YYYY-MM — Excel of the monthly charges
router.get('/monthly/export', requireAdmin, async (req, res) => {
  try {
    const rows = await loadPurchases();
    const { month, customers, grandTotal, grandItems } = aggregateMonthly(rows, req.query.month);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'המחלבה';

    // Sheet 1: Summary
    const s1 = workbook.addWorksheet('סיכום', { views: [{ rightToLeft: true }] });
    s1.columns = [{ header: 'שדה', key: 'field', width: 25 }, { header: 'ערך', key: 'value', width: 30 }];
    styleHeader(s1.getRow(1), 'FF131F2E');
    s1.addRow({ field: 'חודש', value: month });
    s1.addRow({ field: 'סה"כ חיובים', value: `₪${grandTotal.toFixed(2)}` });
    s1.addRow({ field: 'לקוחות', value: customers.length });
    s1.addRow({ field: 'סה"כ פריטים', value: grandItems });

    // Sheet 2: Per-customer totals
    const s2 = workbook.addWorksheet('לפי לקוח', { views: [{ rightToLeft: true }] });
    s2.columns = [
      { header: 'שם לקוח', key: 'name', width: 24 },
      { header: 'פריטים', key: 'items', width: 12 },
      { header: 'מוצרים', key: 'products', width: 40 },
      { header: 'סה"כ חיוב', key: 'total', width: 16 }
    ];
    styleHeader(s2.getRow(1), 'FF3B6FD4');
    for (const c of customers) {
      s2.addRow({
        name: c.name,
        items: c.item_count,
        products: c.products.map(p => `${p.product_name} ×${p.quantity}`).join(', '),
        total: `₪${c.total.toFixed(2)}`
      });
    }
    const tot = s2.addRow({ name: 'סה"כ', items: grandItems, total: `₪${grandTotal.toFixed(2)}` });
    tot.font = { bold: true };

    // Sheet 3: Detailed customer × product
    const s3 = workbook.addWorksheet('פירוט', { views: [{ rightToLeft: true }] });
    s3.columns = [
      { header: 'שם לקוח', key: 'name', width: 24 },
      { header: 'מוצר', key: 'product', width: 24 },
      { header: 'כמות', key: 'quantity', width: 10 },
      { header: 'סה"כ', key: 'total', width: 16 }
    ];
    styleHeader(s3.getRow(1), 'FF131F2E');
    for (const c of customers) {
      for (const p of c.products) {
        s3.addRow({ name: c.name, product: p.product_name, quantity: p.quantity, total: `₪${p.total.toFixed(2)}` });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly_charges_${month}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
