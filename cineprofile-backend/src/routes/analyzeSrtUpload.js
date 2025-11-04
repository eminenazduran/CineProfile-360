import express from "express";
import multer from "multer";
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3*1024*1024 } });

router.post("/analyze-srt-upload", upload.single("file"), async (req, res) => {
  // Sadece dosyayı aldığımızı doğrulayıp sabit JSON dönelim
  if (!req.file) return res.status(400).json({ error: "SRT dosyası eksik (field: file)" });
  const size = req.file.size;
  return res.status(200).json({
    debug: { bytes: size },
    scores: { violence: 3, fear: 5 },
    risk_spans: [{ start: 12, end: 16, type: "fear" }]
  });
});

export default router;

