import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/auth/me
 * Returns authenticated user's full onboarding state
 */
router.get("/", requireUser, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        birthdate: true,
        gender: true,
        photos: true,
        preferences: true,
        prompts: true,
        onboardingComplete: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;