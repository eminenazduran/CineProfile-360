import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import analyzeTestRouter from "./routes/analyzeTest.js";
import { testDb } from "./db/pool.js";
import mockAnalyzerRouter from "./routes/mockAnalyzer.js";
import analyzeSrtRouter from "./routes/analyzeSrt.js";
import analyzeSrtUpload from "./routes/analyzeSrtUpload.js";
import titleCardRouter from "./routes/titleCard.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api", analyzeSrtRouter);
app.use("/__mock", mockAnalyzerRouter);
app.use("/api", analyzeTestRouter);
app.use("/api", analyzeSrtUpload);
app.get("/api/__ping", (req, res) => res.json({ ok: true }));

app.use("/api", titleCardRouter);

// HEALTH CHECK
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
