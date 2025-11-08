const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { pool } = require('../db/pool');
const logger = require('../logger');

const ANALYZER_URL = process.env.ANALYZER_URL || 'http://127.0.0.1:5001';
console.log('ANALYZER_URL =', ANALYZER_URL, 'ROUTE =', __filename);

router.post('/analyze-test', async (req, res) => {
  const { text, title } = req.body || {};

  try {
    const t0 = Date.now();

    const resp = await fetch(`${ANALYZER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!resp.ok) {
      const msg = `Analyzer HTTP ${resp.status}`;
      logger.error({ where: 'analyze-test', err: msg });
      return res.status(502).json({ ok: false, error: msg });
    }

    const data = await resp.json();

    const elapsed_ms = data.elapsed_ms ?? (Date.now() - t0);
    const scores = data.scores ?? {};
    const spans  = data.risk_spans ?? [];

    // 🔧 JSONB cast + stringify (PostgreSQL)
    const q = `
      INSERT INTO analyze_logs (title, elapsed_ms, scores, spans)
      VALUES ($1, $2, $3::jsonb, $4::jsonb)
      RETURNING id, created_at
    `;
    const vals = [
      title || null,
      elapsed_ms,
      JSON.stringify(scores),
      JSON.stringify(spans),
    ];

    const result = await pool.query(q, vals);
    const inserted = result.rows[0];

    return res.json({
      ok: true,
      log_id: inserted.id,
      created_at: inserted.created_at,
      analyzer: data
    });
} catch (err) {
  logger.error({ where: 'analyze-test', err: err.message || err });
  // 🔍 geçici debug: tüm hata detayını geri döndür
  return res.status(500).json({
    ok: false,
    error: String(err && err.stack ? err.stack : (err.message || err))
  });
}

});

module.exports = router;
