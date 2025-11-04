import express from "express";
import cors from "cors";
import analyzeSrtUpload from "./routes/analyzeSrtUpload.js";
import analyzeTest from "./routes/analyzeTest.js"; // ← bu önemli!

const app = express();
app.use(cors());
app.use(express.json()); // ← JSON body okumak için

app.use("/api", analyzeSrtUpload);
app.use("/api", analyzeTest); // ← route'u mount ettik

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(process.env.PORT || 3000, () =>
  console.log("CineProfile360 backend running on port", process.env.PORT || 3000)
);
