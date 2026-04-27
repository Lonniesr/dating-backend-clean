import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";
import { sendPushNotification } from "../../../services/push";
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

    // 🔥 Get users with tokens
    const users = await prisma.user.findMany({
      where: {
        pushToken: { not: null },
      },
      select: {
        id: true,
        pushToken: true,
      },
    });

    // ✅ Save notifications in DB
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "admin",
        content: message,
        actorId: null,
      })),
    });

    // 🔔 SEND PUSH (USING YOUR EXISTING FUNCTION)
    await Promise.all(
      users.map((u) =>
        u.pushToken
          ? sendPushNotification({
              token: u.pushToken,
              title: "LynQ",
              body: message,
              data: {
                type: "admin_broadcast",
              },
            })
          : null
      )
    );

    return res.json({
      success: true,
      totalUsers: users.length,
    });
  } catch (err) {
    console.error("ADMIN NOTIFICATION ERROR:", err);

    return res.status(500).json({
      error: "Failed to send notification",
    });
  }
});

export default router;