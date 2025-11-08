require('dotenv').config();
const { Pool } = require('pg');

const isLocalHost = ['localhost', '127.0.0.1'].includes(String(process.env.PG_HOST || '').toLowerCase());
const useSSL = process.env.PG_SSL
  ? process.env.PG_SSL === 'true'
  : !isLocalHost; // PG_SSL belirtilmediyse, localhost değilse SSL kullan

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DB,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000
});

async function testDb() {
  try {
    const { rows } = await pool.query('SELECT NOW() as now');
    console.log('✅ PG SELECT NOW():', rows[0].now);
  } catch (err) {
    console.error('❌ PG connection/test error:', err.message);
  }
}

module.exports = { pool, testDb };
