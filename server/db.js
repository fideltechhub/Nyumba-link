const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper — run a single SQL statement (INSERT / UPDATE / DELETE)
async function run(sql, args = []) {
  return pool.query(sql, args);
}

// Helper — return array of row objects
async function all(sql, args = []) {
  const res = await pool.query(sql, args);
  return res.rows;
}

// Helper — return single row object or null
async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0] || null;
}

async function init() {
  // Create tables
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      email_token TEXT,
      is_suspended INTEGER DEFAULT 0,
      national_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id SERIAL PRIMARY KEY,
      caretaker_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      sub_location TEXT,
      price INTEGER NOT NULL,
      bedrooms INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 1,
      furnished INTEGER DEFAULT 0,
      parking INTEGER DEFAULT 0,
      water INTEGER DEFAULT 0,
      generator INTEGER DEFAULT 0,
      gated INTEGER DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (caretaker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      viewing_date TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES users(id),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    );
  `;

  // Execute each statement separately
  for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (err.code !== '42P07') { // 42P07 = relation already exists
        console.error('Schema init error:', err);
        throw err;
      }
    }
  }

  // Seed admin
  const admin = await get("SELECT id FROM users WHERE role = 'admin'");
  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);
    await run(
      "INSERT INTO users (name, email, phone, password, role, is_verified) VALUES ($1, $2, $3, $4, 'admin', 1)",
      ['Admin', 'nyumbalink@gmail.com', '0700000000', hash]
    );
    console.log('Admin seeded: nyumbalink@gmail.com / admin123');
  }

  console.log('Database ready');
}

module.exports = { pool, run, all, get, init };
