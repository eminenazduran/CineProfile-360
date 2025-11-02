import { Router } from "express";
const router = Router();

router.post("/analyze", (req, res) => {
  res.json({
    violence: 3,
    fear: 5,
    risk_spans: [{ start: 20, end: 40, type: "fear" }]
  });
});

export default router;
