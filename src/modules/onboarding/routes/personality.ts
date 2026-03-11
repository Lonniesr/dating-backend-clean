import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

/**
 * POST /api/onboarding/personality
 * Saves user bio + personality prompts
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const { bio, prompts } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (bio !== undefined && typeof bio !== "string") {
      return res.status(400).json({
        error: "Bio must be a string",
      });
    }

    if (prompts !== undefined && typeof prompts !== "object") {
      return res.status(400).json({
        error: "Prompts must be an object",
      });
    }

    /* =========================
       UPDATE USER
    ========================= */

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(prompts !== undefined && { prompts }),
      },
    });

    return res.json({
      user: updatedUser,
    });

  } catch (err) {
    console.error("ONBOARDING /personality ERROR:", err);

    return res.status(500).json({
      error: "Failed to update personality data",
    });
  }
});

export default router;