import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * PUT /api/settings/preferences
 * Update dating preferences from settings page
 */
router.put("/", requireUser, async (req: any, res) => {
  try {
    const { interestedIn, minAge, maxAge, racePreference, locationRadius } =
      req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          interestedIn,
          minAge,
          maxAge,
          racePreference,
          locationRadius,
        },
      },
    });

    return res.json({
      success: true,
      preferences: updated.preferences,
    });
  } catch (err) {
    console.error("PREFERENCES UPDATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;