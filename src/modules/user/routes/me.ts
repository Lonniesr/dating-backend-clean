import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/auth/me
 * Returns the authenticated user's full onboarding state
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
        createdAt: true,
        lastActiveAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ working: true, user });
  } catch (err) {
    console.error("Error in /me route:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;