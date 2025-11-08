// src/routes/analyzeTest.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const logger = require('../logger');

router.post('/analyze-test', async (req, res) => {
  const { title = 'Untitled', text = '' } = req.body || {};

  const started = Date.now();

  // Normalde analyzer servisini çağırırız; burada demo amaçlı sabit skorlar
  const scores = { violence: 3, fear: 5 };
  const spans = [{ start: 20, end: 40, type: 'fear' }];

  const elapsed_ms = Date.now() - started;

  try {
    const q = `
      INSERT INTO analyze_logs (title, elapsed_ms, scores, spans)
      VALUES ($1, $2, $3::jsonb, $4::jsonb)
      RETURNING id, created_at
    `;
    const params = [title, elapsed_ms, JSON.stringify(scores), JSON.stringify(spans)];
    const result = await pool.query(q, params);

    logger.info({
      event: 'analyze-test',
      title,
      elapsed_ms,
      insert_id: result.rows[0].id
    });

    res.json({
      ok: true,
      inserted: result.rows[0],
      elapsed_ms,
      scores,
      spans
    });
  } catch (err) {
    logger.error({ event: 'analyze-test-error', message: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
