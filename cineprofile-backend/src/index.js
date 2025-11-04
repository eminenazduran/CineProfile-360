import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- BASİT TESTLER ----
app.get("/health", (req, res) => res.json({ status: "ok" }));
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
