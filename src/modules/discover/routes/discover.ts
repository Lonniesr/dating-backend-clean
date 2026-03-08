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

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

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

    const prefs = currentUser.preferences as any;

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

    /* ---------------- PRIMARY FILTER ---------------- */

    const whereClause: any = {
      id: { not: userId },
      onboardingComplete: true,
      banned: false,
    };

    if (prefs?.interestedIn && prefs.interestedIn !== "Everyone") {
      whereClause.gender =
        prefs.interestedIn === "Men" ? "male" : "female";
    }

    if (prefs?.racePreference) {
      whereClause.race = prefs.racePreference;
    }

    if (minBirthdate || maxBirthdate) {
      whereClause.birthdate = {};
      if (minBirthdate) whereClause.birthdate.gte = minBirthdate;
      if (maxBirthdate) whereClause.birthdate.lte = maxBirthdate;
    }

    let candidates = await prisma.user.findMany({
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

    /* ---------------- FALLBACK IF EMPTY ---------------- */

    if (candidates.length === 0) {
      console.log("Discover fallback triggered");

      candidates = await prisma.user.findMany({
        where: {
          id: { not: userId },
          onboardingComplete: true,
          banned: false,
        },
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
    }

    console.log("DISCOVER candidates:", candidates.length);

    res.json(candidates);
  } catch (err) {
    console.error("DISCOVER ERROR:", err);
    res.status(500).json({ message: "Failed to load discover feed." });
  }
});

export default router;