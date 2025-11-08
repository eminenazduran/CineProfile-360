require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

(async ()=>{
  const sql = fs.readFileSync('src/db/schema.sql','utf8');
  const useSSL = String(process.env.PG_SSL||'false').toLowerCase()==='true';
  const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
    ssl: useSSL ? { rejectUnauthorized:false } : false
  });
  await pool.query(sql);
  console.log('Schema applied');
  await pool.end();
})().catch(e=>{ console.error('migrate error:', e.message); process.exit(1); });
