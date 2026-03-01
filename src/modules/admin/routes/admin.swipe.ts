import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/swipe
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const swipes = await prisma.swipe.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ swipes });
  } catch (err) {
    console.error("ADMIN SWIPE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;