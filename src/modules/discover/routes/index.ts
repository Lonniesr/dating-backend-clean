import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Discover routes working" });
});

export default router;