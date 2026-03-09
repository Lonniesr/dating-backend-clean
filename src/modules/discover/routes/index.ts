import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * Haversine distance (miles)
 */
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
       * Current user
       */
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          gender: true,
          birthdate: true,
          preferences: true,
          latitude: true,
          longitude: true,
          createdAt: true,
        },
      });

      if (!currentUser) {
        return res.status(404).json({ message: "User not found." });
      }

      const prefs =
        currentUser.preferences &&
        typeof currentUser.preferences === "object"
          ? (currentUser.preferences as any)
          : {};

      /**
       * Swiped users
       */
      const swipes = await prisma.swipe.findMany({
        where: { swiperId: userId },
        select: { targetId: true },
      });

      const swipedIds = swipes.map((s) => s.targetId);

      /**
       * Matched users
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
          notIn: [...swipedIds, ...matchedIds],
        },

        onboardingComplete: true,
        banned: false,

        photos: {
          isEmpty: false,
        },
      };

      /**
       * Gender preference
       */
      if (prefs.interestedIn && prefs.interestedIn !== "Everyone") {
        whereClause.gender =
          prefs.interestedIn === "Men" ? "male" : "female";
      }

      /**
       * Race preference
       */
      if (prefs.racePreference && prefs.racePreference !== "Everyone") {
        whereClause.race = prefs.racePreference;
      }

      /**
       * Age filter
       */
      if (minBirthdate || maxBirthdate) {
        whereClause.birthdate = {};

        if (minBirthdate) whereClause.birthdate.gte = minBirthdate;
        if (maxBirthdate) whereClause.birthdate.lte = maxBirthdate;
      }

      /**
       * Initial candidate pool
       */
      const candidates = await prisma.user.findMany({
        where: whereClause,

        select: {
          id: true,
          name: true,
          gender: true,
          race: true,
          photos: true,
          birthdate: true,
          location: true,
          latitude: true,
          longitude: true,
          lastActiveAt: true,
          createdAt: true,
        },

        take: 100,
      });

      /**
       * Radius filtering
       */
      let filtered = candidates;

      if (
        prefs.locationRadius &&
        currentUser.latitude &&
        currentUser.longitude
      ) {
        filtered = candidates.filter((user) => {
          if (!user.latitude || !user.longitude) return false;

          const d = distance(
            currentUser.latitude!,
            currentUser.longitude!,
            user.latitude,
            user.longitude
          );

          return d <= prefs.locationRadius;
        });
      }

      /**
       * Ranking algorithm
       */
      const ranked = filtered
        .map((user) => {
          let score = 0;

          /**
           * Activity boost
           */
          if (user.lastActiveAt) {
            const hours =
              (Date.now() - new Date(user.lastActiveAt).getTime()) /
              (1000 * 60 * 60);

            score += Math.max(0, 48 - hours);
          }

          /**
           * Distance boost
           */
          if (
            currentUser.latitude &&
            currentUser.longitude &&
            user.latitude &&
            user.longitude
          ) {
            const d = distance(
              currentUser.latitude,
              currentUser.longitude,
              user.latitude,
              user.longitude
            );

            score += Math.max(0, 50 - d);
          }

          /**
           * New user boost
           */
          const daysSinceJoin =
            (Date.now() - new Date(user.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);

          if (daysSinceJoin < 7) {
            score += 40;
          }

          /**
           * Randomization
           */
          score += Math.random() * 10;

          return { user, score };
        })
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.user);

      res.json(ranked.slice(0, 30));
    } catch (err) {
      console.error("DISCOVER ERROR:", err);

      res.status(500).json({
        message: "Failed to load discover feed.",
      });
    }
  }
);

export default router;