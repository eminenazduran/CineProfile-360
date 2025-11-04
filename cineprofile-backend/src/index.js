import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeSrtUpload from "./routes/analyzeSrtUpload.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("INDEX BOOT");
console.log("INDEX FILE :", __filename);
console.log("PROCESS CWD:", process.cwd());

dotenv.config();

console.log("INDEX BOOT");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", analyzeSrtUpload);

// HEALTH
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// PING (mount doğrulama)
app.get("/api/__ping", (req, res) => res.json({ ok: true }));

// ROUTES
app.use("/api", analyzeSrtUpload);

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
