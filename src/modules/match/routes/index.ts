import { Router } from "express";

const router = Router();

// Temporary test route
router.get("/", (req, res) => {
  res.json({ message: "Match routes working" });
});

export default router;