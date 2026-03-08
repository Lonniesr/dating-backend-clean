import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/swipe
 */
router.post("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const swiperId = req.user.id;
    const { targetId, liked, superLike } = req.body;

    if (!targetId) {
      return res.status(400).json({ message: "Missing targetId" });
    }

    if (targetId === swiperId) {
      return res.status(400).json({ message: "Cannot swipe yourself" });
    }

    const isSuperLike = superLike === true;

    /**
     * Handle super like limits
     */
    if (isSuperLike) {
      const user = await prisma.user.findUnique({
        where: { id: swiperId },
        select: {
          superLikesRemaining: true,
          superLikesResetAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let remaining = user.superLikesRemaining ?? 0;
      let resetAt = user.superLikesResetAt;

      const now = new Date();

      if (resetAt && now > resetAt) {
        remaining = 3;

        await prisma.user.update({
          where: { id: swiperId },
          data: {
            superLikesRemaining: 3,
            superLikesResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });
      }

      if (remaining <= 0) {
        return res.status(403).json({
          message: "No super likes remaining",
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

    /**
     * Prevent duplicate swipe
     */
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
          liked: liked === true,
          superLike: isSuperLike,
        },
      });
    }

    /**
     * Check reciprocal swipe
     */
    const reciprocal = await prisma.swipe.findFirst({
      where: {
        swiperId: targetId,
        targetId: swiperId,
        liked: true,
      },
    });

    let isMatch = false;

    if (liked === true && reciprocal) {
      const existingMatch = await prisma.match.findFirst({
        where: {
          OR: [
            {
              userAId: swiperId,
              userBId: targetId,
            },
            {
              userAId: targetId,
              userBId: swiperId,
            },
          ],
        },
      });

      if (!existingMatch) {
        await prisma.match.create({
          data: {
            userAId: swiperId,
            userBId: targetId,
          },
        });
      }

      isMatch = true;
    }

    res.json({
      success: true,
      isMatch,
    });
  } catch (err) {
    console.error("SWIPE ERROR:", err);

    res.status(500).json({
      message: "Swipe failed",
    });
  }
});

export default router;