// src/app.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import analyzeTestRouter from "./routes/analyzeTest.js"; // varsa analiz test stub'ı

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/__ping", (_req, res) => res.json({ ok: true }));

// routes
app.use("/api", authRoutes);
app.use("/api", policyRoutes);
app.use("/api", analyzeTestRouter); // dosya varsa; yoksa bu satır sorun çıkarmaz diye comment'leyebilirsin

export default app;
