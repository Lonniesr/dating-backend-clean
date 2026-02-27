// src/modules/invite/routes/index.ts

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Invite route working" });
});

export default router;