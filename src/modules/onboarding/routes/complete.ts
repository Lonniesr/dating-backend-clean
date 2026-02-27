import { Router } from "express";
import prisma from "../../../prisma";                    // FIXED
import { requireUser } from "../../../middleware/requireUser";
const router = Router();

router.post("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    return res.json({
      user: updated,
    });
  } catch (err) {
    console.error("ONBOARDING /complete ERROR:", err);
    return res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

export default router;
