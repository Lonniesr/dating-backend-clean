import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * POST /api/admin/notifications/broadcast
 */
router.post("/broadcast", requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const users = await prisma.user.findMany({
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "admin",
        content: message, // ✅ NOW VALID
        actorId: null,
      })),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("ADMIN NOTIFICATION ERROR:", err);

    return res.status(500).json({
      error: "Failed to send notification",
    });
  }
});

export default router;