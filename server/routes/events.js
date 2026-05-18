const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/events/:id/public (no auth, for customer view)
router.get('/:id/public', (req, res) => {
  const event = db.prepare('SELECT id, name, date, notes, is_active FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });
  if (!event.is_active) return res.status(403).json({ error: 'האירוע אינו פעיל' });

  const products = db.prepare('SELECT * FROM products WHERE event_id = ?').all(event.id);
  res.json({ ...event, products });
});

// GET /api/events
router.get('/', requireAdmin, (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      COUNT(DISTINCT p.id) as product_count,
      COALESCE(SUM(pu.total_price), 0) as total_revenue
    FROM events e
    LEFT JOIN products p ON p.event_id = e.id
    LEFT JOIN purchases pu ON pu.event_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(events);
});

// POST /api/events
router.post('/', requireAdmin, (req, res) => {
  const { name, date, expected_people, notes, products } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'שם ותאריך נדרשים' });
  }

  const insertEvent = db.prepare(
    'INSERT INTO events (name, date, expected_people, notes) VALUES (?, ?, ?, ?)'
  );
  const insertProduct = db.prepare(
    'INSERT INTO products (event_id, name, price, available_quantity) VALUES (?, ?, ?, ?)'
  );

  const createEventAndProducts = db.transaction(() => {
    const result = insertEvent.run(name, date, expected_people || null, notes || null);
    const eventId = result.lastInsertRowid;

    if (products && Array.isArray(products)) {
      for (const product of products) {
        if (product.name && product.price !== undefined) {
          insertProduct.run(eventId, product.name, product.price, product.available_quantity || null);
        }
      }
    }

    return eventId;
  });

  const eventId = createEventAndProducts();
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  const eventProducts = db.prepare('SELECT * FROM products WHERE event_id = ?').all(eventId);

  res.status(201).json({ ...event, products: eventProducts });
});

// GET /api/events/:id
router.get('/:id', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const products = db.prepare('SELECT * FROM products WHERE event_id = ?').all(event.id);
  const purchases = db.prepare(`
    SELECT pu.*, p.name as product_name, p.price as product_price
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    WHERE pu.event_id = ?
    ORDER BY pu.created_at DESC
  `).all(event.id);

  res.json({ ...event, products, purchases });
});

// PUT /api/events/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { name, date, expected_people, notes, is_active } = req.body;
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  db.prepare(`
    UPDATE events SET name = ?, date = ?, expected_people = ?, notes = ?, is_active = ?
    WHERE id = ?
  `).run(
    name || event.name,
    date || event.date,
    expected_people !== undefined ? expected_people : event.expected_people,
    notes !== undefined ? notes : event.notes,
    is_active !== undefined ? is_active : event.is_active,
    event.id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
  res.json(updated);
});

// DELETE /api/events/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const deleteAll = db.transaction(() => {
    db.prepare('DELETE FROM purchases WHERE event_id = ?').run(event.id);
    db.prepare('DELETE FROM products WHERE event_id = ?').run(event.id);
    db.prepare('DELETE FROM events WHERE id = ?').run(event.id);
  });

  deleteAll();
  res.json({ message: 'האירוע נמחק בהצלחה' });
});

// GET /api/events/:id/qr
router.get('/:id/qr', requireAdmin, async (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const baseUrl = req.query.base_url || process.env.PUBLIC_URL || 'http://localhost:5173';
  const url = `${baseUrl}/event/${event.id}`;

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#2c3e50', light: '#ffffff' }
    });
    res.json({ qr: dataUrl, url });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה ביצירת קוד QR' });
  }
});

// GET /api/events/:id/export
router.get('/:id/export', requireAdmin, async (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const products = db.prepare('SELECT * FROM products WHERE event_id = ?').all(event.id);
  const purchases = db.prepare(`
    SELECT pu.*, p.name as product_name
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    WHERE pu.event_id = ?
    ORDER BY pu.customer_name, pu.created_at DESC
  `).all(event.id);

  const totalRevenue = purchases.reduce((sum, p) => sum + p.total_price, 0);
  const totalItems = purchases.reduce((sum, p) => sum + p.quantity, 0);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'המחלבה';
  workbook.created = new Date();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('סיכום אירוע', {
    views: [{ rightToLeft: true }]
  });

  summarySheet.columns = [
    { header: 'שדה', key: 'field', width: 25 },
    { header: 'ערך', key: 'value', width: 30 }
  ];

  summarySheet.getRow(1).font = { bold: true, size: 12 };
  summarySheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' }
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };

  summarySheet.addRow({ field: 'שם האירוע', value: event.name });
  summarySheet.addRow({ field: 'תאריך', value: event.date });
  summarySheet.addRow({ field: 'משתתפים צפויים', value: event.expected_people || '-' });
  summarySheet.addRow({ field: 'הכנסה כוללת', value: `₪${totalRevenue.toFixed(2)}` });
  summarySheet.addRow({ field: 'סה"כ פריטים שנמכרו', value: totalItems });
  summarySheet.addRow({ field: 'מספר עסקאות', value: purchases.length });

  if (event.notes) {
    summarySheet.addRow({ field: 'הערות', value: event.notes });
  }

  // Products summary
  summarySheet.addRow({});
  summarySheet.addRow({ field: 'מוצר', value: 'כמות שנמכרה | הכנסה' });
  summarySheet.getRow(summarySheet.lastRow.number).font = { bold: true };

  for (const product of products) {
    const productPurchases = purchases.filter(p => p.product_id === product.id);
    const qty = productPurchases.reduce((sum, p) => sum + p.quantity, 0);
    const rev = productPurchases.reduce((sum, p) => sum + p.total_price, 0);
    summarySheet.addRow({ field: product.name, value: `${qty} יח' | ₪${rev.toFixed(2)}` });
  }

  // Sheet 2: Purchases list
  const purchasesSheet = workbook.addWorksheet('רשימת רכישות', {
    views: [{ rightToLeft: true }]
  });

  purchasesSheet.columns = [
    { header: 'מספר', key: 'id', width: 8 },
    { header: 'שם לקוח', key: 'customer_name', width: 20 },
    { header: 'מוצר', key: 'product_name', width: 20 },
    { header: 'כמות', key: 'quantity', width: 10 },
    { header: 'מחיר ליחידה', key: 'unit_price', width: 15 },
    { header: 'סה"כ', key: 'total_price', width: 15 },
    { header: 'הוסף על ידי', key: 'added_by', width: 15 },
    { header: 'תאריך ושעה', key: 'created_at', width: 20 }
  ];

  purchasesSheet.getRow(1).font = { bold: true, size: 11 };
  purchasesSheet.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' }
  };
  purchasesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

  for (const purchase of purchases) {
    const unitPrice = purchase.quantity > 0 ? purchase.total_price / purchase.quantity : 0;
    purchasesSheet.addRow({
      id: purchase.id,
      customer_name: purchase.customer_name || 'אנונימי',
      product_name: purchase.product_name,
      quantity: purchase.quantity,
      unit_price: `₪${unitPrice.toFixed(2)}`,
      total_price: `₪${purchase.total_price.toFixed(2)}`,
      added_by: purchase.added_by === 'admin' ? 'מנהל' : 'לקוח',
      created_at: new Date(purchase.created_at).toLocaleString('he-IL')
    });
  }

  // Totals row
  const totalsRow = purchasesSheet.addRow({
    customer_name: 'סה"כ',
    quantity: totalItems,
    total_price: `₪${totalRevenue.toFixed(2)}`
  });
  totalsRow.font = { bold: true };
  totalsRow.fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' }
  };

  // Sheet 3: Customer summary
  const customerSheet = workbook.addWorksheet('סיכום לקוחות', {
    views: [{ rightToLeft: true }]
  });

  customerSheet.columns = [
    { header: 'שם לקוח', key: 'name', width: 22 },
    { header: 'כמות ביקורים', key: 'visits', width: 16 },
    { header: 'מוצרים שנרכשו', key: 'products', width: 35 },
    { header: 'סה"כ פריטים', key: 'total_qty', width: 14 },
    { header: 'סה"כ תשלום', key: 'total_paid', width: 16 },
    { header: 'ביקור אחרון', key: 'last_visit', width: 20 }
  ];

  const hdr = customerSheet.getRow(1);
  hdr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF131F2E' } };

  // Group by customer name
  const byCustomer = {};
  for (const p of purchases) {
    const key = p.customer_name || 'אנונימי';
    if (!byCustomer[key]) byCustomer[key] = { purchases: [], sessions: new Set() };
    byCustomer[key].purchases.push(p);
    if (p.session_id) byCustomer[key].sessions.add(p.session_id);
  }

  for (const [name, data] of Object.entries(byCustomer)) {
    const totalQty = data.purchases.reduce((s, p) => s + p.quantity, 0);
    const totalPaid = data.purchases.reduce((s, p) => s + p.total_price, 0);
    const visits = data.sessions.size || 1;
    const productSummary = [...new Set(data.purchases.map(p => p.product_name))].join(', ');
    const lastVisit = data.purchases.reduce((latest, p) =>
      new Date(p.created_at) > new Date(latest) ? p.created_at : latest,
      data.purchases[0].created_at
    );
    customerSheet.addRow({
      name,
      visits,
      products: productSummary,
      total_qty: totalQty,
      total_paid: `₪${totalPaid.toFixed(2)}`,
      last_visit: new Date(lastVisit).toLocaleString('he-IL')
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="event_${event.id}.xlsx"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
});

// GET /api/events/:id/export-customers — per-customer detail export for one event
router.get('/:id/export-customers', requireAdmin, async (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'אירוע לא נמצא' });

  const purchases = db.prepare(`
    SELECT pu.*, p.name as product_name
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    WHERE pu.event_id = ?
    ORDER BY pu.customer_name, pu.created_at
  `).all(event.id);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'המחלבה';

  // One sheet per customer
  const byCustomer = {};
  for (const p of purchases) {
    const key = p.customer_name || 'אנונימי';
    if (!byCustomer[key]) byCustomer[key] = [];
    byCustomer[key].push(p);
  }

  // Summary sheet
  const summarySheet = workbook.addWorksheet('סיכום כולל', { views: [{ rightToLeft: true }] });
  summarySheet.columns = [
    { header: 'שם לקוח', key: 'name', width: 22 },
    { header: 'כמות ביקורים', key: 'visits', width: 16 },
    { header: 'סה"כ פריטים', key: 'qty', width: 14 },
    { header: 'סה"כ תשלום', key: 'paid', width: 16 },
    { header: 'ביקור אחרון', key: 'last', width: 22 }
  ];
  const sh = summarySheet.getRow(1);
  sh.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  sh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF131F2E' } };

  for (const [name, rows] of Object.entries(byCustomer)) {
    const sessions = new Set(rows.filter(r => r.session_id).map(r => r.session_id));
    summarySheet.addRow({
      name,
      visits: sessions.size || 1,
      qty: rows.reduce((s, r) => s + r.quantity, 0),
      paid: `₪${rows.reduce((s, r) => s + r.total_price, 0).toFixed(2)}`,
      last: new Date(rows[rows.length - 1].created_at).toLocaleString('he-IL')
    });
  }

  // Detailed sheet per customer
  for (const [name, rows] of Object.entries(byCustomer)) {
    const sheetName = name.substring(0, 31);
    const ws = workbook.addWorksheet(sheetName, { views: [{ rightToLeft: true }] });
    ws.columns = [
      { header: 'מוצר', key: 'product', width: 20 },
      { header: 'כמות', key: 'qty', width: 10 },
      { header: 'מחיר', key: 'price', width: 14 },
      { header: 'שעה', key: 'time', width: 22 }
    ];
    const wh = ws.getRow(1);
    wh.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    wh.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B6FD4' } };

    // Group by session
    const bySess = {};
    for (const r of rows) {
      const sid = r.session_id || r.created_at;
      if (!bySess[sid]) bySess[sid] = [];
      bySess[sid].push(r);
    }

    let visitNum = 1;
    for (const sessRows of Object.values(bySess)) {
      const visitLabel = ws.addRow({ product: `ביקור ${visitNum}`, qty: '', price: '', time: new Date(sessRows[0].created_at).toLocaleString('he-IL') });
      visitLabel.font = { bold: true, italic: true, color: { argb: 'FF3B6FD4' } };
      for (const r of sessRows) {
        ws.addRow({ product: r.product_name, qty: r.quantity, price: `₪${r.total_price.toFixed(2)}`, time: '' });
      }
      visitNum++;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="customers_${event.id}.xlsx"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
});

module.exports = router;
