import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/swipe
 */
router.post("/", requireUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    const swiperId = req.user?.id;

    if (!swiperId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { targetId, liked, superLike } = req.body;

    if (!targetId || typeof targetId !== "string") {
      return res.status(400).json({ error: "Invalid targetId" });
    }

    if (targetId === swiperId) {
      return res.status(400).json({ error: "Cannot swipe yourself" });
    }

    const isLiked = liked === true;
    const isSuperLike = superLike === true;

    /* ===============================
       HANDLE SUPER LIKE LIMIT
    =============================== */

    if (isSuperLike) {
      const user = await prisma.user.findUnique({
        where: { id: swiperId },
        select: {
          superLikesRemaining: true,
          superLikesResetAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let remaining = user.superLikesRemaining ?? 0;
      const now = new Date();

      if (user.superLikesResetAt && now > user.superLikesResetAt) {
        remaining = 3;

        await prisma.user.update({
          where: { id: swiperId },
          data: {
            superLikesRemaining: 3,
            superLikesResetAt: new Date(now.getTime() + 86400000),
          },
        });
      }

      if (remaining <= 0) {
        return res.status(403).json({
          error: "No super likes remaining",
        });
      }

      await prisma.user.update({
        where: { id: swiperId },
        data: {
          superLikesRemaining: {
            decrement: 1,
          },
        },
      });
    }

    /* ===============================
       PREVENT DUPLICATE SWIPES
    =============================== */

    const existingSwipe = await prisma.swipe.findUnique({
      where: {
        swiperId_targetId: {
          swiperId,
          targetId,
        },
      },
    });

    if (!existingSwipe) {
      await prisma.swipe.create({
        data: {
          swiperId,
          targetId,
          liked: isLiked,
          superLike: isSuperLike,
        },
      });
    }

    /* ===============================
       CHECK RECIPROCAL LIKE
    =============================== */

    let isMatch = false;

    if (isLiked) {
      const reciprocal = await prisma.swipe.findFirst({
        where: {
          swiperId: targetId,
          targetId: swiperId,
          liked: true,
        },
      });

      if (reciprocal) {
        const [userAId, userBId] =
          swiperId < targetId
            ? [swiperId, targetId]
            : [targetId, swiperId];

        await prisma.match.upsert({
          where: {
            userAId_userBId: {
              userAId,
              userBId,
            },
          },
          update: {},
          create: {
            userAId,
            userBId,
          },
        });

        isMatch = true;
      }
    }

    return res.json({
      success: true,
      isMatch,
    });

  } catch (err) {
    console.error("SWIPE ERROR:", err);

    return res.status(500).json({
      error: "Swipe failed",
    });
  }
});

export default router;