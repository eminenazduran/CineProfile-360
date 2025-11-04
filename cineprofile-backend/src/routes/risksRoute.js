import express from "express";
const router = express.Router();

const cache = new Map();

/**
 * GET /api/risks/:titleId
 * Stub: Analyzer çıktısını cache ederek döner.
 */
router.get("/risks/:titleId", (req, res) => {
  const { titleId } = req.params;

  if (cache.has(titleId)) {
    return res.json(cache.get(titleId));
  }

  const data = {
    titleId,
    violence: 3,
    fear: 7,
    risk_spans: [
      { start: 10, end: 25, type: "violence", score: 6 },
      { start: 40, end: 55, type: "fear", score: 8 },
    ],
  };

  cache.set(titleId, data);
  res.json(data);
});

export default router;
