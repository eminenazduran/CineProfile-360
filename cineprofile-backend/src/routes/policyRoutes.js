// src/routes/policyRoutes.js
import express from "express";
import pkg from "pg";

const router = express.Router();
const { Pool } = pkg;

// In-memory yedek
let memoryPolicies = {
  1: { autoplay: true, dimScreen: false, skipViolence: false },
};

// Pool'ı koşullu kur (PG env varsa)
let pool = null;
if (process.env.PG_HOST && process.env.PG_USER && process.env.PG_DB) {
  pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DB,
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
}

// tabloyu oluştur (varsa atla)
async function ensureTable() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS policies (
      user_id INT PRIMARY KEY,
      autoplay BOOLEAN NOT NULL DEFAULT true,
      dim_screen BOOLEAN NOT NULL DEFAULT false,
      skip_violence BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}
ensureTable().catch((e) => console.warn("[policies] ensureTable warn:", e.message));

// GET /api/policies/me
router.get("/policies/me", async (req, res) => {
  const userId = 1; // mock
  try {
    if (pool) {
      const r = await pool.query(`SELECT autoplay, dim_screen, skip_violence FROM policies WHERE user_id=$1`, [userId]);
      if (r.rows.length) {
        const row = r.rows[0];
        return res.json({
          autoplay: row.autoplay,
          dimScreen: row.dim_screen,
          skipViolence: row.skip_violence,
          source: "pg",
        });
      }
      // yoksa memory fallback + pg'ye de ekle
      const m = memoryPolicies[userId] || { autoplay: true, dimScreen: false, skipViolence: false };
      await pool.query(
        `INSERT INTO policies (user_id, autoplay, dim_screen, skip_violence) VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, m.autoplay, m.dimScreen, m.skipViolence]
      );
      return res.json({ ...m, source: "pg-init" });
    } else {
      const m = memoryPolicies[userId] || { autoplay: true, dimScreen: false, skipViolence: false };
      return res.json({ ...m, source: "memory" });
    }
  } catch (e) {
    console.error("GET /policies/me err:", e);
    // PG patlarsa memory'den dön
    const m = memoryPolicies[userId] || { autoplay: true, dimScreen: false, skipViolence: false };
    return res.json({ ...m, source: "memory-fallback", error: e.message });
  }
});

// PUT /api/policies/me
router.put("/policies/me", express.json(), async (req, res) => {
  const userId = 1; // mock
  const { autoplay, dimScreen, skipViolence } = req.body || {};
  const cleaned = {
    autoplay: Boolean(autoplay),
    dimScreen: Boolean(dimScreen),
    skipViolence: Boolean(skipViolence),
  };

  memoryPolicies[userId] = cleaned;

  try {
    if (pool) {
      await ensureTable();
      await pool.query(
        `INSERT INTO policies (user_id, autoplay, dim_screen, skip_violence, updated_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET autoplay=EXCLUDED.autoplay,
                       dim_screen=EXCLUDED.dim_screen,
                       skip_violence=EXCLUDED.skip_violence,
                       updated_at=NOW()`,
        [userId, cleaned.autoplay, cleaned.dimScreen, cleaned.skipViolence]
      );
      return res.json({ message: "Policy updated (pg)", data: cleaned });
    } else {
      return res.json({ message: "Policy updated (memory)", data: cleaned });
    }
  } catch (e) {
    console.error("PUT /policies/me err:", e);
    return res.status(500).json({ error: "update_failed", detail: e.message });
  }
});

export default router;
