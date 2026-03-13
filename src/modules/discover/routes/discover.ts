import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import redis from "../../../redis";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

const DISCOVER_CACHE_TTL = 60;
const PAGE_SIZE = 30;
const BUFFER_SIZE = 60;

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 3958.8;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

router.get(
  "/",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const cursor = Number(req.query.cursor || 0);

      const cacheKey = `discover:${userId}:${cursor}`;

      /**
       * CACHE HIT
       */

      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      /**
       * LOAD USER
       */

      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          preferences: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const prefs =
        currentUser.preferences &&
        typeof currentUser.preferences === "object"
          ? (currentUser.preferences as any)
          : {};

      /**
       * USERS YOU SWIPED
       */

      const swipes = await prisma.swipe.findMany({
        where: { swiperId: userId },
        select: { targetId: true },
      });

      const swipedIds = swipes.map((s) => s.targetId);

      /**
       * USERS WHO LIKED YOU
       */

      const swipedYou = await prisma.swipe.findMany({
        where: { targetId: userId, liked: true },
        select: { swiperId: true },
      });

      const likedYouIds = swipedYou.map((s) => s.swiperId);
      const likedYouSet = new Set(likedYouIds);

      /**
       * MATCHES
       */

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: { userAId: true, userBId: true },
      });

      const matchedIds = matches
        .flatMap((m) => [m.userAId, m.userBId])
        .filter((id) => id !== userId);

      const excludedIds = [...swipedIds, ...matchedIds].slice(0, 500);

      /**
       * FETCH CANDIDATES
       */

      const candidates = await prisma.user.findMany({
        where: {
          id: {
            not: userId,
            notIn: excludedIds,
          },

          onboardingComplete: true,
          banned: false,

          photos: {
            some: {},
          },
        },

        select: {
          id: true,
          name: true,
          gender: true,
          race: true,
          birthdate: true,
          location: true,
          latitude: true,
          longitude: true,
          lastActiveAt: true,

          photos: {
            select: { url: true },
            orderBy: { order: "asc" },
          },
        },

        take: 200,
      });

      /**
       * RANKING ALGORITHM
       */

      const ranked = candidates
        .map((user) => {
          let score = 0;

          if (likedYouSet.has(user.id)) score += 500;

          if (user.lastActiveAt) {
            const hours =
              (Date.now() - new Date(user.lastActiveAt).getTime()) /
              (1000 * 60 * 60);

            score += Math.max(0, 100 - hours);
          }

          score += (user.photos?.length || 0) * 10;

          if (
            currentUser.latitude &&
            currentUser.longitude &&
            user.latitude &&
            user.longitude
          ) {
            const dist = calculateDistance(
              currentUser.latitude,
              currentUser.longitude,
              user.latitude,
              user.longitude
            );

            score += Math.max(0, 50 - dist);
          }

          score += Math.random() * 10;

          return { ...user, score };
        })
        .sort((a, b) => b.score - a.score);

      /**
       * CURSOR WINDOW
       */

      const windowed = ranked.slice(cursor, cursor + BUFFER_SIZE);

      const profiles = windowed.slice(0, PAGE_SIZE).map((u) => ({
        id: u.id,
        name: u.name,
        gender: u.gender,
        race: u.race,
        birthdate: u.birthdate,
        location: u.location,
        latitude: u.latitude,
        longitude: u.longitude,
        photos: u.photos?.map((p) => p.url) ?? [],
      }));

      const response = {
        profiles,
        nextCursor: cursor + PAGE_SIZE,
      };

      /**
       * SAVE CACHE
       */

      await redis.set(cacheKey, JSON.stringify(response), {
        EX: DISCOVER_CACHE_TTL,
      });

      return res.json(response);
    } catch (err) {
      console.error("DISCOVER ERROR:", err);

      return res.status(500).json({
        message: "Failed to load discover feed",
      });
    }
  }
);

export default router;