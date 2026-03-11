import { Router } from "express";
import swipeRouter from "./swipe";

const router = Router();

/* Health check */

router.get("/", (_req, res) => {
  res.json({ message: "Swipe routes working" });
});

/* Actual swipe routes */

router.use("/", swipeRouter);

export default router;