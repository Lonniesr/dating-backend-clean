import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import redis from "../../../redis";
import { requireUser } from "../../../middleware/requireUser";
import { calculateElo } from "../../../utils/elo"; // ✅ NEW

const router = Router();

/**
 * POST /api/swipe
 */

router.post(
  "/",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
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
         ELO RANKING UPDATE (FIXED)
      =============================== */

      const [swiper, target] = await Promise.all([
        prisma.user.findUnique({
          where: { id: swiperId },
          select: { eloScore: true, role: true },
        }),
        prisma.user.findUnique({
          where: { id: targetId },
          select: { eloScore: true, role: true },
        }),
      ]);

      // 🔐 prevent admin / invalid targets
      if (!target || target.role !== "user") {
        return res.status(400).json({ error: "Invalid target" });
      }

      if (swiper && target) {
        const result = isLiked ? 1 : 0;

        const newSwiperElo = calculateElo(
          swiper.eloScore,
          target.eloScore,
          result
        );

        const newTargetElo = calculateElo(
          target.eloScore,
          swiper.eloScore,
          isLiked ? 1 : 0
        );

        await prisma.$transaction([
          prisma.user.update({
            where: { id: swiperId },
            data: { eloScore: newSwiperElo },
          }),
          prisma.user.update({
            where: { id: targetId },
            data: { eloScore: newTargetElo },
          }),
        ]);
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

          const existingMatch = await prisma.match.findFirst({
            where: {
              userAId,
              userBId,
            },
          });

          if (!existingMatch) {
            await prisma.match.create({
              data: {
                userAId,
                userBId,
              },
            });

            await prisma.notification.create({
              data: {
                userId: targetId,
                type: "match",
                actorId: swiperId,
              },
            });
          }

          isMatch = true;
        }
      }

      /* ===============================
         DISCOVER CACHE INVALIDATION
      =============================== */

      if (redis) {
        await redis.del(`discover:${swiperId}`);
        await redis.del(`discover:${targetId}`);
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
  }
);

export default router; 