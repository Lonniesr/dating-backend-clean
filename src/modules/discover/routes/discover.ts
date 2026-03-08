import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/discover
 * Returns swipe candidates
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
       * Get current user
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
        return res.status(404).json({ message: "User not found." });
      }

      const prefs = currentUser.preferences as any;

      /**
       * Users already swiped
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
       * Age filtering
       */
      const today = new Date();

      let minBirthdate: Date | undefined;
      let maxBirthdate: Date | undefined;

      if (prefs?.minAge) {
        maxBirthdate = new Date(
          today.getFullYear() - prefs.minAge,
          today.getMonth(),
          today.getDate()
        );
      }

      if (prefs?.maxAge) {
        minBirthdate = new Date(
          today.getFullYear() - prefs.maxAge,
          today.getMonth(),
          today.getDate()
        );
      }

      /**
       * Base discover filter
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
      if (prefs?.interestedIn && prefs.interestedIn !== "Everyone") {
        whereClause.gender =
          prefs.interestedIn === "Men" ? "male" : "female";
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
       * Discover candidates
       */
      const candidates = await prisma.user.findMany({
        where: whereClause,

        select: {
          id: true,
          name: true,
          gender: true,
          photos: true,
          birthdate: true,
          location: true,
          latitude: true,
          longitude: true,
          lastActiveAt: true,
        },

        take: 30,
      });

      /**
       * Basic activity ranking
       * (recently active users appear first)
       */
      const ranked = candidates.sort((a, b) => {
        const aTime = a.lastActiveAt
          ? new Date(a.lastActiveAt).getTime()
          : 0;

        const bTime = b.lastActiveAt
          ? new Date(b.lastActiveAt).getTime()
          : 0;

        return bTime - aTime;
      });

      res.json(ranked);
    } catch (err) {
      console.error("DISCOVER ERROR:", err);

      res.status(500).json({
        message: "Failed to load discover feed.",
      });
    }
  }
);

export default router;