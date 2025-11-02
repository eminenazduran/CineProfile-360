import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

export const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DB,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
});

export async function testDb() {
  try {
    const { rows } = await pool.query("SELECT NOW() as now");
    console.log("🟢 PG SELECT NOW():", rows[0].now);
  } catch (err) {
    console.error("🔴 PG connection/test error:", err.message);
  }
}
