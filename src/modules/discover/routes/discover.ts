import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/discover
 * Returns swipe candidates for the logged-in user
 */
router.get("/", requireUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get current user with preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gender: true,
        birthdate: true,
        race: true,
        preferences: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const preferences = currentUser.preferences as any;

    // Users this user already swiped on
    const swipes = await prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { targetId: true },
    });
    const swipedIds = swipes.map((s) => s.targetId);

    // Users already matched
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });

    const matchedIds = matches
      .flatMap((m) => [m.userAId, m.userBId])
      .filter((id) => id !== userId);

    // Calculate birthdate boundaries for age filter
    const today = new Date();

    let minBirthdate: Date | undefined;
    let maxBirthdate: Date | undefined;

    if (preferences?.minAge) {
      maxBirthdate = new Date(
        today.getFullYear() - preferences.minAge,
        today.getMonth(),
        today.getDate()
      );
    }

    if (preferences?.maxAge) {
      minBirthdate = new Date(
        today.getFullYear() - preferences.maxAge,
        today.getMonth(),
        today.getDate()
      );
    }

    // Build dynamic where clause
    const whereClause: any = {
      id: {
        not: userId,
        notIn: [...swipedIds, ...matchedIds],
      },
      onboardingComplete: true,
      photos: { isEmpty: false },
    };

    // Gender filter
    if (preferences?.interestedIn && preferences.interestedIn !== "Everyone") {
      whereClause.gender =
        preferences.interestedIn === "Men" ? "male" : "female";
    }

    // Race preference filter
    if (preferences?.racePreference) {
      whereClause.race = preferences.racePreference;
    }

    // Age filter
    if (minBirthdate || maxBirthdate) {
      whereClause.birthdate = {};
      if (minBirthdate) whereClause.birthdate.gte = minBirthdate;
      if (maxBirthdate) whereClause.birthdate.lte = maxBirthdate;
    }

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
      },
      take: 20,
    });

    res.json(candidates);
  } catch (err) {
    console.error("DISCOVER ERROR:", err);
    res.status(500).json({ message: "Failed to load discover feed." });
  }
});

export default router;