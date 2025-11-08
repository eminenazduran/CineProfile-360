// src/db/pool.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER,
  // Hem PG_PASSWORD hem PG_PASS'i destekle
  password: process.env.PG_PASSWORD || process.env.PG_PASS,
  database: process.env.PG_DB,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
