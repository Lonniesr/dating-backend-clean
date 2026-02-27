import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

router.post("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ error: "Preferences required" });
    }

    let {
      interestedIn,
      racePreference,
      minAge,
      maxAge,
      locationRadius,
    } = preferences;

    // ----- Basic Validation -----

    if (!interestedIn || typeof interestedIn !== "string") {
      return res.status(400).json({ error: "InterestedIn is required" });
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

    // Allow null radius (means "any")
    if (locationRadius !== null) {
      locationRadius = Number(locationRadius);

      if (
        Number.isNaN(locationRadius) ||
        locationRadius < 5 ||
        locationRadius > 100
      ) {
        return res.status(400).json({ error: "Invalid location radius" });
      }
    }

    // ----- Update Safely -----

    const existing = req.user.preferences || {};

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...existing, // preserve future fields
          interestedIn,
          racePreference: racePreference || null,
          minAge,
          maxAge,
          locationRadius: locationRadius ?? null,
        },
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    console.error("PREFERENCES UPDATE ERROR:", err);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;