import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/swipe/stats
 */
router.get("/", requireUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    const [
      likesGiven,
      passesGiven,
      superLikesGiven,
      likesReceived,
      matches
    ] = await Promise.all([

      prisma.swipe.count({
        where: {
          swiperId: userId,
          liked: true
        }
      }),

      prisma.swipe.count({
        where: {
          swiperId: userId,
          liked: false
        }
      }),

      prisma.swipe.count({
        where: {
          swiperId: userId,
          superLike: true
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
            { userAId: userId },
            { userBId: userId }
          ]
        }
      })

    ]);

    return res.json({
      likesGiven,
      passesGiven,
      superLikesGiven,
      likesReceived,
      matches
    });

  } catch (err) {
    console.error("SWIPE STATS ERROR:", err);

    return res.status(500).json({
      message: "Failed to load swipe stats"
    });
  }
});

export default router;