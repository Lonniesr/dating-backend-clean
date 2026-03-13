import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/notifications
 * Returns unread counts for navbar badges
 */
router.get(
  "/",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      /**
       * Unread messages
       */
      const unreadMessages = await prisma.message.count({
        where: {
          receiverId: userId,
          read: false,
        },
      });

      /**
       * Users who liked you (but you haven't swiped yet)
       */
      const likes = await prisma.swipe.findMany({
        where: {
          targetId: userId,
          liked: true,
        },
        select: { swiperId: true },
      });

      const likedUserIds = likes.map((l) => l.swiperId);

      /**
       * Remove users you've already swiped
       */
      const yourSwipes = await prisma.swipe.findMany({
        where: { swiperId: userId },
        select: { targetId: true },
      });

      const alreadySwiped = new Set(yourSwipes.map((s) => s.targetId));

      const newLikes = likedUserIds.filter((id) => !alreadySwiped.has(id))
        .length;

      return res.json({
        unreadMessages,
        newLikes,
      });
    } catch (err) {
      console.error("NOTIFICATIONS ERROR:", err);

      return res.status(500).json({
        message: "Failed to load notifications",
      });
    }
  }
);

export default router;