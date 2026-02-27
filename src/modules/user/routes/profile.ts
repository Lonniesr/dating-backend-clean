import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

// GET /api/profile
router.get("/", requireUser, async (req, res) => {
  try {
    // ✅ Type guard (fixes "possibly undefined")
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await prisma.user.findUnique({
      where: { id: req.user.id }, // ✅ fixed
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

export default router;