import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeTestRouter from "./routes/analyzeTest.js";
import { testDb } from "./db/pool.js";
import mockAnalyzerRouter from "./routes/mockAnalyzer.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/__mock", mockAnalyzerRouter);
app.use("/api", analyzeTestRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
  await testDb();
});
