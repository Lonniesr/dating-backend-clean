import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/onboarding/complete
 * Marks onboarding as finished
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
      },
      select: {
        id: true,
        onboardingComplete: true,
      },
    });

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("ONBOARDING /complete ERROR:", err);

    return res.status(500).json({
      error: "Failed to complete onboarding",
    });
  }
});

export default router;