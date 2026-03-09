import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.get("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;

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

    const swipes = await prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { targetId: true },
    });

    const swipedIds = swipes.map((s) => s.targetId);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });

    const matchedIds = matches
      .flatMap((m) => [m.userAId, m.userBId])
      .filter((id) => id !== userId);

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

    const candidates = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
          notIn: [...swipedIds, ...matchedIds],
        },

        onboardingComplete: true,

        photos: {
          some: {},
        },

        ...(prefs?.interestedIn && prefs.interestedIn !== "everyone"
          ? { gender: prefs.interestedIn }
          : {}),

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
        birthdate: true,
        location: true,
        bio: true,
        photos: {
          orderBy: { order: "asc" },
          select: { url: true },
        },
      },

      take: 20,
    });

    res.json({
      success: true,
      results: candidates.map((c) => ({
        ...c,
        photos: c.photos.map((p) => p.url),
      })),
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