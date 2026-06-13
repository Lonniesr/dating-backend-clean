import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/notifications/badges
 */
router.get(
  "/badges",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      console.log("LOADING NOTIFICATION BADGES FOR USER:", req.user?.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [
        unreadMessages,
        newLikes,
        newMatches
      ] = await Promise.all([

        prisma.message.count({
          where: {
            receiverId: userId,
            read: false
          }
        }),

        prisma.swipe.count({
          where: {
            targetId: userId,
            liked: true
          }
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
}) 

      ]);
console.log("BADGES:", {
  unreadMessages,
  newLikes,
  newMatches,
});
     return res.json({
  TEST: "BADGES_ROUTE_IS_RUNNING",
  unreadMessages,
  newLikes,
  newMatches
});

    } catch (err) {
      console.error("NOTIFICATION BADGES ERROR:", err);

      return res.status(500).json({
        error: "Failed to load notifications"
      });
    }
  }
);

export default router;