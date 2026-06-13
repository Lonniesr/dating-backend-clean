import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/* =================================
   GET NOTIFICATION BADGES
================================= */

router.get("/badges", requireUser, async (req: any, res) => {
  try {
    console.log("🔥 USER NOTIFICATIONS ROUTE HIT");

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const [unreadMessages, newMatches] = await Promise.all([
      prisma.message.count({
        where: {
          receiverId: userId,
          read: false,
        },
      }),

      prisma.match.count({
        where: {
          OR: [
            {
              userAId: userId,
              userASeen: false,
            },
            {
              userBId: userId,
              userBSeen: false,
            },
          ],
        },
      }),
    ]);

    console.log("🔥 BADGES:", {
      unreadMessages,
      newMatches,
    });

    return res.json({
      unreadMessages,
      newMatches,
      notifications: unreadMessages + newMatches,
    });
  } catch (err) {
    console.error("BADGES ERROR:", err);

    return res.status(500).json({
      error: "Failed to load badges",
    });
  }
});

export default router;