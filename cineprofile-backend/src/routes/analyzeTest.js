// cineprofile-backend/src/routes/analyzeTest.js
import { Router } from "express";
import fetch from "node-fetch"; // Node 18+ kullanıyorsan buna gerek kalmayabilir

const router = Router();

router.post("/analyze-test", async (req, res) => {
  try {
    const text = (req.body?.text || "").toString();
    const ANALYZER_URL = process.env.ANALYZER_URL || "http://127.0.0.1:5001";

    const r = await fetch(`${ANALYZER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const json = await r.json();
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: "analyze-test failed", detail: String(e) });
  }
});

export default router;
