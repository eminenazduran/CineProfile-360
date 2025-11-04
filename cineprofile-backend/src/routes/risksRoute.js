import express from "express";
const router = express.Router();

// Basit bellek cache’i
const cache = {};

// GET /api/risks/:titleId
router.get("/risks/:titleId", async (req, res) => {
  const { titleId } = req.params;

  // Eğer daha önce istek yapıldıysa cache’ten dön
  if (cache[titleId]) {
    console.log("🌀 Cache hit:", titleId);
    return res.json(cache[titleId]);
  }

  try {
    // Şimdilik dummy analyzer verisi
    const dummy = {
      titleId,
      violence: Math.floor(Math.random() * 10),
      fear: Math.floor(Math.random() * 10),
      risk_spans: [
        { start: 10, end: 25, type: "violence", score: 6 },
        { start: 40, end: 55, type: "fear", score: 8 },
      ],
    };

    // Cache’e kaydet
    cache[titleId] = dummy;
    res.json(dummy);
  } catch (err) {
    console.error("risks route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
