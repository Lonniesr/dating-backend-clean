import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.get("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const personalityComplete =
      Array.isArray(user.prompts) && user.prompts.length > 0;

    const photosComplete =
      Array.isArray(user.photos) && user.photos.length >= 1;

    const checks = {
      name: !!user.name,
      gender: !!user.gender,
      preferences: !!user.preferences,
      personality: personalityComplete,
      photos: photosComplete
    };

    const total = Object.keys(checks).length;
    const completed = Object.values(checks).filter(Boolean).length;

    const percent = Math.round((completed / total) * 100);

    return res.json({
      percent,
      checks
    });

  } catch (err) {
    console.error("PROFILE COMPLETION ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;