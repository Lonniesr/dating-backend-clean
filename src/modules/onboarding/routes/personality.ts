import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";                    // FIXED

const router = Router();

router.post("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { prompts } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { prompts },
    });

    return res.json({
      user: updated,
    });
  } catch (err) {
    console.error("ONBOARDING /personality ERROR:", err);
    return res.status(500).json({ error: "Failed to update personality prompts" });
  }
});

export default router;
