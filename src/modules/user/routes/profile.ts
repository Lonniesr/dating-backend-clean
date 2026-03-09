import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/profile
 * Returns the authenticated user's profile
 */
router.get(
  "/",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const profile = await prisma.user.findUnique({
        where: { id: userId },

        select: {
          id: true,
          email: true,
          role: true,

          name: true,
          username: true,
          birthdate: true,
          gender: true,
          race: true,

          bio: true,
          birthplace: true,
          location: true,

          latitude: true,
          longitude: true,

          photos: true,
          prompts: true,

          preferences: true,

          verified: true,
          verification_status: true,

          onboardingComplete: true,
          lastActiveAt: true,
        },
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      return res.json(profile);
    } catch (err) {
      console.error("PROFILE FETCH ERROR:", err);

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

/**
 * POST /api/profile/location
 * Save user GPS coordinates
 */
router.post(
  "/location",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { latitude, longitude } = req.body;

      const lat = Number(latitude);
      const lon = Number(longitude);

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return res.status(400).json({
          error: "Invalid latitude or longitude",
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          latitude: lat,
          longitude: lon,
        },
      });

      return res.json({
        success: true,
        message: "Location saved",
      });
    } catch (err) {
      console.error("LOCATION SAVE ERROR:", err);

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

export default router;