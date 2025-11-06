// src/index.js
import app from "./app.js";
import analyzeTestRouter from "./routes/analyzeTest.js";

// ⬇️ Bunu listen'dan ÖNCE ekle
app.use("/api", analyzeTestRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CineProfile360 backend running on port ${PORT}`);
});
