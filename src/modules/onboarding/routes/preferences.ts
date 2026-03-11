import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const payload =
      req.body.preferences && typeof req.body.preferences === "object"
        ? req.body.preferences
        : req.body;

    let { interestedIn, racePreference, minAge, maxAge, locationRadius } = payload;

    if (!interestedIn || typeof interestedIn !== "string") {
      return res.status(400).json({ error: "interestedIn is required" });
    }

    minAge = Number(minAge);
    maxAge = Number(maxAge);

    if (
      Number.isNaN(minAge) ||
      Number.isNaN(maxAge) ||
      minAge < 18 ||
      maxAge > 100 ||
      minAge >= maxAge
    ) {
      return res.status(400).json({ error: "Invalid age range" });
    }

    if (locationRadius !== undefined && locationRadius !== null) {
      locationRadius = Number(locationRadius);

      if (Number.isNaN(locationRadius) || locationRadius < 5 || locationRadius > 100) {
        return res.status(400).json({ error: "Invalid location radius" });
      }
    } else {
      locationRadius = null;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingPreferences =
      currentUser.preferences && typeof currentUser.preferences === "object"
        ? (currentUser.preferences as Record<string, any>)
        : {};

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...existingPreferences,
          interestedIn,
          racePreference: racePreference || null,
          minAge,
          maxAge,
          locationRadius,
        },
      },
      select: {
        id: true,
        preferences: true,
      },
    });

    return res.json({
      success: true,
      user: updatedUser,
    });

  } catch (err) {
    console.error("PREFERENCES UPDATE ERROR:", err);

    return res.status(500).json({
      error: "Failed to update preferences",
    });
  }
});

export default router;