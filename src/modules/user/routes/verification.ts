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
    const { selfieUrl } = req.body; // ✅ ADD THIS

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

    if (!selfieUrl) {
      return res.status(400).json({
        error: "Selfie is required",
      });
    }

    /**
     * Save selfie for admin review
     */

    await prisma.user.update({
      where: { id: userId },
      data: {
        verification_selfie: selfieUrl, // ✅ SAVE IMAGE
        verification_status: "pending", // ✅ ADD STATUS
        verified: false, // ✅ DO NOT auto verify
      },
    });

    return res.json({
      success: true,
      message: "Verification submitted",
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;