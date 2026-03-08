import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/profile
 */
router.get("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        birthdate: true,
        gender: true,
        photos: true,
        preferences: true,
        prompts: true,
        onboardingComplete: true,
        location: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json(profile);
  } catch (err) {
    console.error("PROFILE FETCH ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/profile/location
 * Saves user GPS coordinates
 */
router.post("/location", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        latitude,
        longitude,
      },
    });

    return res.json({
      success: true,
      message: "Location saved",
    });
  } catch (err) {
    console.error("LOCATION SAVE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;