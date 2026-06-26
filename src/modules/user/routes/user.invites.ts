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

    const dbUser = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    verified: true,
  },
});

if (!dbUser) {
  return res.status(401).json({
    error: "Unauthorized",
  });
}

if (!dbUser.verified) {
  return res.status(403).json({
    error: "Verify your profile to create Personal Invites.",
  });
}

    /* ✅ FIXED (NO STATIC IMPORT) */
    const { nanoid } = await import("nanoid");
    const code = nanoid(10);

    const invite = await prisma.invite.create({
  data: {
    code,
    invitedById: userId,
    used: false,
    redirectToInviter: true,
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