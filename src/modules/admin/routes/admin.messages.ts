import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/messages
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },

      // ✅ THIS IS THE FIX
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({ messages });
  } catch (err) {
    console.error("ADMIN MESSAGES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;