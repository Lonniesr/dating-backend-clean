import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/* =================================
   GET NOTIFICATION BADGES
================================= */

router.get("/badges", requireUser, async (req, res) => {
  try {
    console.log("🔥 USER NOTIFICATIONS ROUTE HIT");
    res.json({
      messages: 0,
      matches: 0,
      notifications: 0,
    });
  } catch (err) {
    console.error("BADGES ERROR:", err);
    res.status(500).json({ error: "Failed to load badges" });
  }
});

export default router;