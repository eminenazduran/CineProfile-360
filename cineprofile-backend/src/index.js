// src/index.js (ESM)
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer(); // bellek üstünde dosya tutar
const PORT = process.env.PORT || 3000;
const ANALYZER_URL = process.env.ANALYZER_URL || "http://127.0.0.1:5001";

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
      { start: 40, end: 55, type: "fear", score: 8 },
    ],
  });
});

// ---- GÜN 5: BACKEND → ANALYZER PROXY (metin analizi) ----
app.post("/api/analyze-test", async (req, res) => {
  try {
    const r = await fetch(`${ANALYZER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body || {}),
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    console.error("analyze-test error:", err);
    return res.status(500).json({ error: "Analyzer proxy failed", detail: String(err) });
  }
});

// ✅ ---- GÜN 6: SRT UPLOAD PROXY ----
app.post("/api/analyze-srt-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    // Node 18+ global FormData / Blob
    const form = new FormData();
    form.append("file", new Blob([req.file.buffer]), req.file.originalname);

    const r = await fetch(`${ANALYZER_URL}/analyze`, {
      method: "POST",
      body: form,
    });

    if (!r.ok) {
      const msg = await r.text();
      throw new Error(`Analyzer responded ${r.status}: ${msg}`);
    }

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    console.error("analyze-srt-upload error:", err);
    return res.status(500).json({ error: "Analyzer proxy failed", detail: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
