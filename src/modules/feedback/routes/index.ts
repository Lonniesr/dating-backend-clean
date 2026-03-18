import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

/**
 * POST /api/feedback
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const { message, page } = req.body;

    if (!message || message.length < 5) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        message,
        page: page || null,
      },
    });

    console.log("🐛 FEEDBACK:", feedback);

    return res.json({
      success: true,
    });

  } catch (err) {
    console.error("FEEDBACK ERROR:", err);

    return res.status(500).json({
      error: "Failed to submit feedback",
    });
  }
});

export default router;