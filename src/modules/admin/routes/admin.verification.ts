import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/verification
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { verified: false },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (err) {
    console.error("ADMIN VERIFICATION ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;