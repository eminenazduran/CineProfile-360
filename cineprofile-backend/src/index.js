// src/index.js  (ESM)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ROUTES
import analyzeSrtUpload from "./routes/analyzeSrtUpload.js";
import risksRoute from "./routes/risksRoute.js";
// (diğer route’ların varsa burada import et)
// import analyzeTestRouter from "./routes/analyzeTest.js";
// import titleCardRouter from "./routes/titleCard.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// HEALTH
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// ROUTE MOUNTS (app oluşturulduktan SONRA!)
app.use("/api", analyzeSrtUpload);
app.use("/api", risksRoute);
// app.use("/api", analyzeTestRouter);
// app.use("/api", titleCardRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
