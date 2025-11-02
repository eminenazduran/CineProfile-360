import { Router } from "express";
import fetch from "node-fetch"; // Node 18+ ise global fetch yeterli

const router = Router();

/**
 * POST /api/analyze-srt
 * Body: { text: string }   // SRT yerine şimdilik düz metin
 * Response (stabil şema):
 * {
 *   scores: { violence:number, fear:number },
 *   risk_spans: [{ start:number, end:number, type:string }]
 * }
 */
router.post("/analyze-srt", async (req, res) => {
  try {
    const { text = "" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Body should include 'text': string" });
    }
    if (!process.env.ANALYZER_URL) {
      return res.status(500).json({ error: "ANALYZER_URL is missing in env" });
    }

    const url = `${process.env.ANALYZER_URL}/analyze`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Analyzer responded ${upstream.status}` });
    }

    // Kevser’den gelen eski/dummy şemayı normalize ediyoruz
    // Örn: {violence:3, fear:5, risk_spans:[...]} → sabit şemaya dönüştür
    const raw = await upstream.json();
    const response = {
      scores: {
        violence: Number(raw?.violence ?? 0),
        fear: Number(raw?.fear ?? 0),
      },
      risk_spans: Array.isArray(raw?.risk_spans) ? raw.risk_spans : [],
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("analyze-srt error:", err);
    return res.status(500).json({ error: "Internal error in /analyze-srt" });
  }
});

export default router;
