import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/user/verify
 * User requests verification
 */
router.post("/", requireUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        verified: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verified) {
      return res.json({
        message: "Already verified",
      });
    }

    /**
     * In a real system this would trigger
     * moderation review. For now we flag it.
     */

    await prisma.user.update({
      where: { id: userId },
      data: {
        verified: true,
      },
    });

    return res.json({
      success: true,
      verified: true,
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;