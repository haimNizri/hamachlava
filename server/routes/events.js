const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/events/:id/public
router.get('/:id/public', async (req, res) => {
  try {
    const { rows: ev } = await pool.query(
      'SELECT id, name, date, notes, is_active FROM events WHERE id = $1', [req.params.id]
    );
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });
    if (!ev[0].is_active) return res.status(403).json({ error: 'האירוע אינו פעיל' });

    const { rows: products } = await pool.query('SELECT * FROM products WHERE event_id = $1', [ev[0].id]);
    res.json({ ...ev[0], products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(pu.total_price), 0) as total_revenue
      FROM events e
      LEFT JOIN products p ON p.event_id = e.id
      LEFT JOIN purchases pu ON pu.event_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
router.post('/', requireAdmin, async (req, res) => {
  const { name, date, expected_people, notes, products } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'שם ותאריך נדרשים' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ev } = await client.query(
      'INSERT INTO events (name, date, expected_people, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, date, expected_people || null, notes || null]
    );
    const event = ev[0];

    if (products && Array.isArray(products)) {
      for (const p of products) {
        if (p.name && p.price !== undefined) {
          await client.query(
            'INSERT INTO products (event_id, name, price, available_quantity) VALUES ($1, $2, $3, $4)',
            [event.id, p.name, p.price, p.available_quantity || null]
          );
        }
      }
    }

    await client.query('COMMIT');

    const { rows: eventProducts } = await pool.query('SELECT * FROM products WHERE event_id = $1', [event.id]);
    res.status(201).json({ ...event, products: eventProducts });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/events/:id
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });

    const { rows: products } = await pool.query('SELECT * FROM products WHERE event_id = $1', [ev[0].id]);
    const { rows: purchases } = await pool.query(`
      SELECT pu.*, p.name as product_name, p.price as product_price
      FROM purchases pu
      JOIN products p ON p.id = pu.product_id
      WHERE pu.event_id = $1
      ORDER BY pu.created_at DESC
    `, [ev[0].id]);

    res.json({ ...ev[0], products, purchases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/events/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });
    const e = ev[0];

    const { name, date, expected_people, notes, is_active } = req.body;
    const { rows } = await pool.query(`
      UPDATE events SET name=$1, date=$2, expected_people=$3, notes=$4, is_active=$5 WHERE id=$6 RETURNING *
    `, [
      name || e.name,
      date || e.date,
      expected_people !== undefined ? expected_people : e.expected_people,
      notes !== undefined ? notes : e.notes,
      is_active !== undefined ? is_active : e.is_active,
      e.id
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: ev } = await client.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });

    await client.query('BEGIN');
    await client.query('DELETE FROM purchases WHERE event_id = $1', [ev[0].id]);
    await client.query('DELETE FROM products WHERE event_id = $1', [ev[0].id]);
    await client.query('DELETE FROM events WHERE id = $1', [ev[0].id]);
    await client.query('COMMIT');

    res.json({ message: 'האירוע נמחק בהצלחה' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/events/:id/qr
// GET /api/events/:id/customers — customers who purchased in this event
router.get('/:id/customers', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT
        c.id, c.first_name, c.last_name,
        COUNT(DISTINCT pu.session_id) as visits,
        COALESCE(SUM(pu.total_price), 0) as total_spent
      FROM purchases pu
      LEFT JOIN customers c ON c.id = pu.customer_id
      WHERE pu.event_id = $1 AND pu.customer_id IS NOT NULL
      GROUP BY c.id, c.first_name, c.last_name
      ORDER BY c.first_name, c.last_name
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/qr', requireAdmin, async (req, res) => {
  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });

    const baseUrl = req.query.base_url || process.env.PUBLIC_URL || 'http://localhost:5173';
    const url = `${baseUrl}/event/${ev[0].id}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#131f2e', light: '#ffffff' } });
    res.json({ qr: dataUrl, url });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה ביצירת קוד QR' });
  }
});

// GET /api/events/:id/export
router.get('/:id/export', requireAdmin, async (req, res) => {
  try {
    const { rows: ev } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!ev[0]) return res.status(404).json({ error: 'אירוע לא נמצא' });
    const event = ev[0];

    const { rows: products } = await pool.query('SELECT * FROM products WHERE event_id = $1', [event.id]);
    const { rows: purchases } = await pool.query(`
      SELECT pu.*, p.name as product_name
      FROM purchases pu JOIN products p ON p.id = pu.product_id
      WHERE pu.event_id = $1
      ORDER BY pu.customer_name, pu.created_at DESC
    `, [event.id]);

    const totalRevenue = purchases.reduce((s, p) => s + Number(p.total_price), 0);
    const totalItems = purchases.reduce((s, p) => s + p.quantity, 0);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'המחלבה';

    // Sheet 1: Summary
    const s1 = workbook.addWorksheet('סיכום אירוע', { views: [{ rightToLeft: true }] });
    s1.columns = [{ header: 'שדה', key: 'field', width: 25 }, { header: 'ערך', key: 'value', width: 30 }];
    styleHeader(s1.getRow(1), 'FF131F2E');
    s1.addRow({ field: 'שם האירוע', value: event.name });
    s1.addRow({ field: 'תאריך', value: event.date });
    s1.addRow({ field: 'משתתפים צפויים', value: event.expected_people || '-' });
    s1.addRow({ field: 'הכנסה כוללת', value: `₪${totalRevenue.toFixed(2)}` });
    s1.addRow({ field: 'סה"כ פריטים', value: totalItems });
    s1.addRow({ field: 'עסקאות', value: purchases.length });
    if (event.notes) s1.addRow({ field: 'הערות', value: event.notes });
    s1.addRow({});
    const prodHdr = s1.addRow({ field: 'מוצר', value: 'כמות | הכנסה' });
    prodHdr.font = { bold: true };
    for (const prod of products) {
      const pp = purchases.filter(p => p.product_id === prod.id);
      s1.addRow({ field: prod.name, value: `${pp.reduce((s,p)=>s+p.quantity,0)} יח' | ₪${pp.reduce((s,p)=>s+Number(p.total_price),0).toFixed(2)}` });
    }

    // Sheet 2: Purchases
    const s2 = workbook.addWorksheet('רשימת רכישות', { views: [{ rightToLeft: true }] });
    s2.columns = [
      { header: '#', key: 'id', width: 8 },
      { header: 'שם לקוח', key: 'customer_name', width: 20 },
      { header: 'מוצר', key: 'product_name', width: 20 },
      { header: 'כמות', key: 'quantity', width: 10 },
      { header: 'מחיר ליח\'', key: 'unit_price', width: 15 },
      { header: 'סה"כ', key: 'total_price', width: 15 },
      { header: 'נוסף ע"י', key: 'added_by', width: 15 },
      { header: 'תאריך / שעה', key: 'created_at', width: 22 }
    ];
    styleHeader(s2.getRow(1), 'FF131F2E');
    for (const p of purchases) {
      s2.addRow({
        id: p.id,
        customer_name: p.customer_name || 'אנונימי',
        product_name: p.product_name,
        quantity: p.quantity,
        unit_price: `₪${(Number(p.total_price)/p.quantity).toFixed(2)}`,
        total_price: `₪${Number(p.total_price).toFixed(2)}`,
        added_by: p.added_by === 'admin' ? 'מנהל' : 'לקוח',
        created_at: new Date(p.created_at).toLocaleString('he-IL')
      });
    }
    const tot = s2.addRow({ customer_name: 'סה"כ', quantity: totalItems, total_price: `₪${totalRevenue.toFixed(2)}` });
    tot.font = { bold: true };

    // Sheet 3: Customers summary
    const s3 = workbook.addWorksheet('סיכום לקוחות', { views: [{ rightToLeft: true }] });
    s3.columns = [
      { header: 'שם לקוח', key: 'name', width: 22 },
      { header: 'ביקורים', key: 'visits', width: 14 },
      { header: 'מוצרים', key: 'products', width: 35 },
      { header: 'פריטים', key: 'qty', width: 12 },
      { header: 'סה"כ', key: 'paid', width: 16 },
      { header: 'ביקור אחרון', key: 'last', width: 22 }
    ];
    styleHeader(s3.getRow(1), 'FF3B6FD4');
    const byC = {};
    for (const p of purchases) {
      const k = p.customer_name || 'אנונימי';
      if (!byC[k]) byC[k] = { rows: [], sessions: new Set() };
      byC[k].rows.push(p);
      if (p.session_id) byC[k].sessions.add(p.session_id);
    }
    for (const [name, d] of Object.entries(byC)) {
      s3.addRow({
        name,
        visits: d.sessions.size || 1,
        products: [...new Set(d.rows.map(r => r.product_name))].join(', '),
        qty: d.rows.reduce((s,r)=>s+r.quantity,0),
        paid: `₪${d.rows.reduce((s,r)=>s+Number(r.total_price),0).toFixed(2)}`,
        last: new Date(d.rows[d.rows.length-1].created_at).toLocaleString('he-IL')
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="event_${event.id}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function styleHeader(row, argb) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

module.exports = router;
