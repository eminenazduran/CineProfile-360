import { Router } from "express";
// Node 18+ global fetch var. 18'den küçükse aşağıyı aç ve node-fetch kur:
// import fetch from "node-fetch";

const router = Router();

router.post("/analyze-test", async (req, res) => {
  try {
    const { text = "" } = req.body || {};

    if (!process.env.ANALYZER_URL) {
      return res.status(500).json({ error: "ANALYZER_URL is missing in env" });
    }
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Body should include 'text': string" });
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

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("analyze-test error:", err);
    return res.status(500).json({ error: "Internal error in /analyze-test" });
  }
});

export default router;
