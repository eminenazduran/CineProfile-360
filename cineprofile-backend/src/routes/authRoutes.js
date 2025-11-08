// src/routes/authRoutes.js
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// Basit fake user
const fakeUser = {
  id: 1,
  name: "Hilal Gül Arıboğa",
  email: "hilalaribogaa@gmail.com",
  role: "developer",
};

// Secret .env'den okunur; yoksa devsecret
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// POST /api/auth/mock-login  -> { token }
router.post("/auth/mock-login", (req, res) => {
  const token = jwt.sign(fakeUser, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// GET /api/me -> Authorization: Bearer <token>
router.get("/me", (req, res) => {
  const h = req.headers.authorization || "";
  const parts = h.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "No or bad Authorization header" });
  }
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    res.json(decoded);
  } catch (e) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
