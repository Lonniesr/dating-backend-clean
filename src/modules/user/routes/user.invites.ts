import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/user/invites
 * Logged-in users create their own invite
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = user.id;

    /* ✅ FIXED (NO STATIC IMPORT) */
    const { nanoid } = await import("nanoid");
    const code = nanoid(10);

    const invite = await prisma.invite.create({
      data: {
        code,
        invitedById: userId,
        used: false,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/invite/${invite.code}`;

    return res.json({
      id: invite.id,
      code: invite.code,
      inviteLink,
    });

  } catch (error) {
    console.error("Create user invite error:", error);
    return res.status(500).json({ error: "Failed to create invite" });
  }
});

export default router;