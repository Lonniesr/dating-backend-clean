import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * Calculate distance in miles using Haversine formula
 */
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

      /**
       * Load current user
       */
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          gender: true,
          birthdate: true,
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
       * Users YOU swiped
       */
      const swipes = await prisma.swipe.findMany({
        where: { swiperId: userId },
        select: { targetId: true },
      });

      const swipedIds = swipes.map((s) => s.targetId);

      /**
       * Users who swiped YOU
       */
      const swipedYou = await prisma.swipe.findMany({
        where: { targetId: userId, liked: true },
        select: { swiperId: true },
      });

      const swipedYouIds = swipedYou.map((s) => s.swiperId);

      /**
       * Matches
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

      const excludedIds = [...swipedIds, ...matchedIds].slice(0, 500);

      /**
       * Age filtering
       */
      const today = new Date();

      let minBirthdate: Date | undefined;
      let maxBirthdate: Date | undefined;

      if (prefs.minAge) {
        maxBirthdate = new Date(
          today.getFullYear() - prefs.minAge,
          today.getMonth(),
          today.getDate()
        );
      }

      if (prefs.maxAge) {
        minBirthdate = new Date(
          today.getFullYear() - prefs.maxAge,
          today.getMonth(),
          today.getDate()
        );
      }

      /**
       * Base query
       */
      const whereClause: any = {
        id: {
          not: userId,
          notIn: excludedIds,
        },

        onboardingComplete: true,
        banned: false,

        photos: {
          some: {},
        },
      };

      if (prefs.interestedIn && prefs.interestedIn !== "Everyone") {
        whereClause.gender =
          prefs.interestedIn === "Men" ? "male" : "female";
      }

      if (prefs.racePreference && prefs.racePreference !== "Everyone") {
        whereClause.race = prefs.racePreference;
      }

      if (minBirthdate || maxBirthdate) {
        whereClause.birthdate = {};

        if (minBirthdate) whereClause.birthdate.gte = minBirthdate;
        if (maxBirthdate) whereClause.birthdate.lte = maxBirthdate;
      }

      /**
       * Fetch candidates
       */
      const candidates = await prisma.user.findMany({
        where: whereClause,

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

        take: 120,
      });

      /**
       * Location filtering
       */
      let filtered = candidates;

      if (
        prefs.locationRadius &&
        currentUser.latitude !== null &&
        currentUser.longitude !== null
      ) {
        filtered = candidates.filter((user) => {
          if (user.latitude === null || user.longitude === null) {
            return false;
          }

          const d = calculateDistance(
            currentUser.latitude as number,
            currentUser.longitude as number,
            user.latitude as number,
            user.longitude as number
          );

          return d <= prefs.locationRadius;
        });
      }

      const likedYouSet = new Set(swipedYouIds);

      /**
       * DISCOVER RANKING ALGORITHM
       */
      const ranked = filtered
        .map((user) => {
          let score = 0;

          /* Boost if they liked you */
          if (likedYouSet.has(user.id)) score += 500;

          /* Activity boost */
          if (user.lastActiveAt) {
            const hoursSinceActive =
              (Date.now() - new Date(user.lastActiveAt).getTime()) /
              (1000 * 60 * 60);

            score += Math.max(0, 100 - hoursSinceActive);
          }

          /* Photo count boost */
          score += (user.photos?.length || 0) * 10;

          /* Distance boost */
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

          /* Randomization */
          score += Math.random() * 15;

          return { ...user, score };
        })
        .sort((a, b) => b.score - a.score);

      /**
       * Convert photos → string[]
       */
      const formatted = ranked.slice(0, 30).map((u) => ({
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

      return res.json(formatted);

    } catch (err) {
      console.error("DISCOVER ERROR:", err);

      return res.status(500).json({
        message: "Failed to load discover feed",
      });
    }
  }
);

export default router;