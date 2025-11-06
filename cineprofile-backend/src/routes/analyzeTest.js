import express from "express";
import fetch from "node-fetch";
const router = express.Router();

router.post("/analyze-test", async (req, res) => {
  try {
    const { text = "" } = req.body || {};
    const ANALYZER_URL = process.env.ANALYZER_URL || "http://127.0.0.1:5001";

    let result;
    try {
      const r = await fetch(`${ANALYZER_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!r.ok) throw new Error(`Analyzer returned ${r.status}`);

      // Analyzer 200 dönse bile HTML dönebilir → JSON parse hatasını yakalayalım
      try {
        result = await r.json();
      } catch (e) {
        throw new Error("Analyzer returned non-JSON body");
      }
    } catch (err) {
      console.warn("[Fallback] Analyzer unreachable/non-JSON:", err.message);
      // Her durumda 200 OK dönen mock
      result = {
        violence: 2,
        fear: 4,
        risk_spans: [{ start: 5, end: 15, type: "fear", score: 5 }],
        mock: true,
      };
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error("Fatal /analyze-test error:", e);
    res.status(500).json({ error: "analyze_test_failed" });
  }
});

export default router;
