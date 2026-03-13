import { Router } from "express";
import swipeRouter from "./swipe";
import likesYouRouter from "./likesYou";
import swipeStatsRouter from "./swipeStats";

const router = Router();

/* Health check */

router.get("/", (_req, res) => {
  res.json({ message: "Swipe routes working" });
});

/* Core swipe action */

router.use("/", swipeRouter);

/* Swipe statistics */

router.use("/stats", swipeStatsRouter);

/* People who liked you */

router.use("/", likesYouRouter);

export default router;