import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/swipe/likes-you
 * Users who liked you but you haven't swiped yet
 */
router.get(
  "/likes-you",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      /**
       * Users YOU already swiped
       */
      const swipes = await prisma.swipe.findMany({
        where: { swiperId: userId },
        select: { targetId: true },
      });

      const swipedIds = swipes.map((s) => s.targetId);

      /**
       * Users already matched
       */
      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: {
          userAId: true,
          userBId: true,
        },
      });

      const matchedIds = matches
        .flatMap((m) => [m.userAId, m.userBId])
        .filter((id) => id !== userId);

      /**
       * Find people who liked YOU
       */
      const likes = await prisma.swipe.findMany({
        where: {
          targetId: userId,
          liked: true,
          swiperId: {
            notIn: [...swipedIds, ...matchedIds],
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
       swiper: {
  select: {
    id: true,
    name: true,
    gender: true,
    race: true,
    birthdate: true,
    location: true,
    shadowBanned: true,

    photos: {
      select: { url: true },
      orderBy: { order: "asc" },
    },
  },
},   
        },
      });

const formatted = likes
  .filter((l) => !l.swiper.shadowBanned)
  .map((l) => ({
      id: l.swiper.id,
        name: l.swiper.name,
        gender: l.swiper.gender,
        race: l.swiper.race,
        birthdate: l.swiper.birthdate,
        location: l.swiper.location,
        photos: l.swiper.photos.map((p) => p.url),
      }));

      return res.json(formatted);

    } catch (err) {
      console.error("LIKES YOU ERROR:", err);

      return res.status(500).json({
        message: "Failed to load likes",
      });
    }
  }
);

export default router;