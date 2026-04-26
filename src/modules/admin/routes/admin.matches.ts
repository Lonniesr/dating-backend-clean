import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/matches
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { createdAt: "desc" },

      // ✅ THIS IS THE FIX
      include: {
        userA: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
        userB: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
      },
    });

    res.json({ matches });
  } catch (err) {
    console.error("ADMIN MATCHES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;