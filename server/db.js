const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

  // Add role column to existing DBs that don't have it yet
  await pool.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`).catch(() => {});

  // Seed superadmin
  const { rows } = await pool.query('SELECT id, role FROM admins WHERE username = $1', ['admin']);
  if (rows.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await pool.query(
      'INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)',
      ['admin', hash, 'superadmin']
    );
    console.log('Superadmin seeded: admin / admin123');
  } else if (rows[0].role !== 'superadmin') {
    await pool.query("UPDATE admins SET role = 'superadmin' WHERE username = 'admin'");
    console.log('Upgraded admin to superadmin');
  }
}

init().catch(err => console.error('DB init error:', err));

module.exports = pool;
