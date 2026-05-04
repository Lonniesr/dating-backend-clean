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
   GET CURRENT USER PROFILE
========================= */
router.get("/", requireUser, async (req: AuthRequest, res: Response) => {
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
      // ✅ FIXED
      select: { id: true, url: true, isPrivate: true },
    });

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

      // ✅ FIXED
      photos: photos.map((p) => ({
        id: p.id,
        url: p.url,
        isPrivate: p.isPrivate,
      })),

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
    return res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   GET OTHER USER PROFILE
========================= */
router.get("/:id", requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const param = req.params.id;

    if (!param || Array.isArray(param)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await prisma.user.findUnique({
      where: { id: param },
    });

    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const photos = await prisma.photo.findMany({
      where: { userId: param },
      orderBy: { order: "asc" },
      // ✅ FIXED
      select: { id: true, url: true, isPrivate: true },
    });

    return res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      age: user.age,
      gender: user.gender,
      race: user.race,
      bio: user.bio,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude,

      // ✅ FIXED
      photos: photos.map((p) => ({
        id: p.id,
        url: p.url,
        isPrivate: p.isPrivate,
      })),

      prompts: user.prompts || {},
      verified: user.verified,
      verification_status: user.verification_status,
    });
  } catch (err) {
    console.error("PROFILE BY ID ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   UPDATE PROFILE (FIXED)
========================= */
router.put("/", requireUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { bio, gender, preferences, prompts } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const existingPrefs =
      typeof existingUser?.preferences === "object" &&
      existingUser?.preferences !== null
        ? (existingUser.preferences as Record<string, any>)
        : {};

    const newPrefs =
      typeof preferences === "object" && preferences !== null
        ? preferences
        : {};

    const mergedPreferences = {
      ...existingPrefs,
      ...newPrefs,
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        gender,
        preferences: mergedPreferences,
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
});

export default router;