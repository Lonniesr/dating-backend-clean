import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/discover
 * Returns swipe candidates for the logged-in user
 */
router.get("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

    // Fetch current user (for preferences)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gender: true,
        preferences: true,
        birthdate: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const prefs =
      typeof currentUser.preferences === "string"
        ? JSON.parse(currentUser.preferences)
        : currentUser.preferences;

    // -------- USERS ALREADY SWIPED --------
    const swipes = await prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { targetId: true },
    });

    const swipedIds = swipes.map((s) => s.targetId);

    // -------- USERS ALREADY MATCHED --------
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });

    const matchedIds = matches
      .flatMap((m) => [m.userAId, m.userBId])
      .filter((id) => id !== userId);

    // -------- AGE FILTER --------
    let minBirthdate: Date | undefined;
    let maxBirthdate: Date | undefined;

    if (prefs?.minAge) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - prefs.minAge);
      maxBirthdate = d;
    }

    if (prefs?.maxAge) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - prefs.maxAge);
      minBirthdate = d;
    }

    // -------- DISCOVER QUERY --------
    const candidates = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
          notIn: [...swipedIds, ...matchedIds],
        },

        onboardingComplete: true,

        photos: {
          isEmpty: false,
        },

        // gender preference
        ...(prefs?.interestedIn && prefs.interestedIn !== "everyone"
          ? { gender: prefs.interestedIn }
          : {}),

        // age filter
        ...(minBirthdate || maxBirthdate
          ? {
              birthdate: {
                ...(minBirthdate ? { gte: minBirthdate } : {}),
                ...(maxBirthdate ? { lte: maxBirthdate } : {}),
              },
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        gender: true,
        photos: true,
        birthdate: true,
        location: true,
        bio: true,
      },

      take: 20,
    });

    res.json({
      success: true,
      results: candidates,
    });
  } catch (err) {
    console.error("DISCOVER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load discover feed.",
    });
  }
});

export default router;