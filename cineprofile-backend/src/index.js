// src/index.js (ESM)
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ANALYZER_URL = process.env.ANALYZER_URL || "http://localhost:5000";

// ---- BASİT TESTLER ----
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/__ping", (_req, res) => res.json({ status: "ok" }));
app.get("/zz", (_req, res) => res.type("text/plain").send("ZZ OK"));
app.get("/api/rtest", (_req, res) => res.json({ ok: true, at: new Date().toISOString() }));

// ---- GÜN 5: RISKS (GEÇİCİ) ----
app.get("/api/risks/:titleId", (req, res) => {
  res.json({
    titleId: req.params.titleId,
    violence: 3,
    fear: 7,
    risk_spans: [
      { start: 10, end: 25, type: "violence", score: 6 },
      { start: 40, end: 55, type: "fear", score: 8 }
    ]
  });
});

// ---- GÜN 5: BACKEND → ANALYZER PROXY ----
// POST /api/analyze-test  →  ANALYZER_URL/analyze
app.post("/api/analyze-test", async (req, res) => {
  try {
    const r = await fetch(`${ANALYZER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {}),
    });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error("analyze-test error:", err);
    res.status(500).json({ error: "Analyzer proxy failed", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
