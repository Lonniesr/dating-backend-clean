import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import redis from "../../../redis";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

const DISCOVER_CACHE_TTL = 60;
const PAGE_SIZE = 30;
const BUFFER_SIZE = 120;

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

      // ✅ normalize preference (FIX)
      const interested = (prefs.interestedIn || "").toLowerCase();

      // ✅ FIX: cache key now includes preference
      const cacheKey = `discover:${userId}:${cursor}:${interested}`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      }

      const onlyVerified = prefs.onlyVerified === true;
      const anyLocation = prefs.locationRadius === null;
      const boostVerified = prefs.boostVerified === true;
      const prioritizeLikedYou = prefs.prioritizeLikedYou === true;

      const swipeData = await prisma.swipe.findMany({
        where: {
          OR: [{ swiperId: userId }, { targetId: userId }],
        },
        select: {
          swiperId: true,
          targetId: true,
          liked: true,
        },
      });

      const swipedIds = new Set<string>();
      const likedYouSet = new Set<string>();

      for (const s of swipeData) {
        if (s.swiperId === userId) {
          swipedIds.add(s.targetId);
        }

        if (s.targetId === userId && s.liked) {
          likedYouSet.add(s.swiperId);
        }
      }

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        select: { userAId: true, userBId: true },
      });

      const matchedIds = new Set<string>();

      for (const m of matches) {
        if (m.userAId !== userId) matchedIds.add(m.userAId);
        if (m.userBId !== userId) matchedIds.add(m.userBId);
      }

      const blocks = await prisma.block.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      const blockedIds = new Set<string>();

      for (const b of blocks) {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      }

      const excludedIds = [
        ...Array.from(swipedIds),
        ...Array.from(matchedIds),
        ...Array.from(blockedIds),
      ].slice(0, 500);

      const candidates = await prisma.user.findMany({
        where: {
          id: {
            not: userId,
            notIn: excludedIds,
          },
          role: "user",
          onboardingComplete: true,
          banned: false,
          photos: { some: {} },

          ...(onlyVerified && {
            verified: true,
          }),

          // ✅ FIXED FILTER (robust)
          ...(interested === "men" && {
            gender: {
              in: ["male", "Male", "man", "Man"],
            },
          }),

          ...(interested === "women" && {
            gender: {
              in: ["female", "Female", "woman", "Woman"],
            },
          }),
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
          eloScore: true,
          verified: true,

          photos: {
            select: { url: true },
            orderBy: { order: "asc" },
          },
        },

        take: 300,
      });

      const ranked = candidates
        .map((user) => {
          let score = 0;

          if (likedYouSet.has(user.id)) {
            score += prioritizeLikedYou ? 1000 : 500;
          }

          if (boostVerified && user.verified) {
            score += 80;
          }

          if (prefs.interestedIn && prefs.interestedIn !== "Everyone") {
            if (
              (interested === "men" && user.gender === "male") ||
              (interested === "women" && user.gender === "female")
            ) {
              score += 50;
            } else {
              score -= 40;
            }
          }

          if (user.birthdate) {
            const age =
              new Date().getFullYear() -
              new Date(user.birthdate).getFullYear();

            if (prefs.minAge && age < prefs.minAge) score -= 50;
            if (prefs.maxAge && age > prefs.maxAge) score -= 50;

            if (
              (!prefs.minAge || age >= prefs.minAge) &&
              (!prefs.maxAge || age <= prefs.maxAge)
            ) {
              score += 40;
            }
          }

          if (user.lastActiveAt) {
            const hours =
              (Date.now() - new Date(user.lastActiveAt).getTime()) /
              (1000 * 60 * 60);

            score += Math.max(0, 100 - hours);
          }

          score += (user.photos?.length || 0) * 10;
          score += user.eloScore * 0.05;

          if (
            !anyLocation &&
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
        photos: (u.photos ?? []).map((p: { url: string }) => p.url),
      }));

      const response = {
        profiles,
        nextCursor: cursor + PAGE_SIZE,
      };

      if (redis) {
        await redis.set(cacheKey, JSON.stringify(response), {
          EX: DISCOVER_CACHE_TTL,
        });
      }

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