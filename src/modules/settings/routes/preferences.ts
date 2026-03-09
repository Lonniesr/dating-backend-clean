import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * PUT /api/settings/preferences
 * Update dating preferences from settings page
 */
router.put("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const {
      interestedIn,
      minAge,
      maxAge,
      racePreference,
      locationRadius,
    } = req.body;

    /* ===============================
       LOAD EXISTING PREFERENCES
    =============================== */

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingPreferences =
      currentUser.preferences &&
      typeof currentUser.preferences === "object"
        ? (currentUser.preferences as Record<string, any>)
        : {};

    /* ===============================
       UPDATE USER
    =============================== */

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...existingPreferences,
          interestedIn,
          minAge,
          maxAge,
          racePreference,
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
      preferences: updatedUser.preferences,
    });

  } catch (err) {
    console.error("PREFERENCES UPDATE ERROR:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;