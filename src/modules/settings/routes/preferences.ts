import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/onboarding/preferences
 * Save dating preferences during onboarding
 */

router.post("/", requireUser, async (req: Request, res: Response) => {
  try {

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        error: "Missing preferences",
      });
    }

    const {
      interestedIn,
      racePreference,
      minAge,
      maxAge,
      locationRadius,
    } = preferences;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          interestedIn,
          racePreference,
          minAge: Number(minAge),
          maxAge: Number(maxAge),
          locationRadius:
            locationRadius === null ? null : Number(locationRadius),
        },
      },
      select: {
        id: true,
        preferences: true,
      },
    });

    return res.json({
      success: true,
      preferences: updatedUser.preferences,
    });

  } catch (err) {

    console.error("ONBOARDING PREFERENCES ERROR:", err);

    return res.status(500).json({
      error: "Server error",
    });

  }
});

export default router;