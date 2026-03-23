import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
  };
};

/* =========================
   GET PROFILE
========================= */
router.get(
  "/",
  requireUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const photos = await prisma.photo.findMany({
        where: { userId },
        orderBy: { order: "asc" },
        select: { url: true },
      });

      /* ✅ INVITE STATS */
      const invitesSent = await prisma.invite.count({
        where: { invitedById: userId },
      });

      const invitesAccepted = await prisma.invite.count({
        where: {
          invitedById: userId,
          used: true,
        },
      });

      const profile = {
        id: user.id,
        email: user.email,
        role: user.role,

        name: user.name,
        username: user.username,

        birthdate: user.birthdate,
        age: user.age,

        gender: user.gender,
        race: user.race,

        bio: user.bio,
        birthplace: user.birthplace,
        location: user.location,

        latitude: user.latitude,
        longitude: user.longitude,

        photos: photos.map((p) => p.url),

        prompts: user.prompts || {},
        preferences: user.preferences || {},

        verified: user.verified,
        verification_status: user.verification_status,

        onboardingComplete: user.onboardingComplete,
        lastActiveAt: user.lastActiveAt,

        invitesSent,
        invitesAccepted,
      };

      return res.json(profile);
    } catch (err) {
      console.error("PROFILE FETCH ERROR:", err);

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

/* =========================
   UPDATE PROFILE
========================= */
router.put(
  "/",
  requireUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        bio,
        gender,
        preferences,
        prompts,
      } = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: {
          bio,
          gender,
          preferences,
          prompts,
        },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("PROFILE UPDATE ERROR:", err);

      return res.status(500).json({
        error: "Failed to update profile",
      });
    }
  }
);

export default router;