const bcrypt = require('bcryptjs');

let pool;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else if (process.env.NODE_ENV === 'production') {
  console.error('FATAL: DATABASE_URL is not set. Add a Postgres database and set the DATABASE_URL environment variable.');
  process.exit(1);
} else {
  const { newDb } = require('pg-mem');
  const mem = newDb();
  const pg = mem.adapters.createPg();
  pool = new pg.Pool();
  console.log('⚠️  אין DATABASE_URL — מריץ Postgres בזיכרון (pg-mem). הנתונים יימחקו עם הפעלה מחדש.');
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      expected_people INTEGER,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id),
      name TEXT NOT NULL,
      price REAL NOT NULL,
      available_quantity INTEGER
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      device_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      registered_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id),
      customer_id INTEGER,
      customer_name TEXT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      added_by TEXT DEFAULT 'customer',
      session_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migrations for existing DBs
  await pool.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`).catch(() => {});
  await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_method TEXT`).catch(() => {});
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS bit_phone TEXT`).catch(() => {});

  // Seed superadmin — always reset password and role on startup (temporary)
  const hash = bcrypt.hashSync('admin123', 10);
  await pool.query(
    `INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, 'superadmin')
     ON CONFLICT (username) DO UPDATE SET password_hash = $2, role = 'superadmin'`,
    ['admin', hash]
  );
  console.log('Superadmin reset: admin / admin123');
}

init().catch(err => console.error('DB init error:', err));

module.exports = pool;
