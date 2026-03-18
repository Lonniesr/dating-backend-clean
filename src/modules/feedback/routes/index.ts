import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
  };
};

/**
 * POST /api/feedback
 */
router.post("/", requireUser, async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Ensure user is defined (fixes TS + runtime safety)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

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