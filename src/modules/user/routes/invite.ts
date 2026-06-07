import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/* ✅ nanoid helper */
const generateNanoId = async (length: number) => {
  const { nanoid } = await import("nanoid");
  return nanoid(length);
};

/**
 * POST /api/user/invites
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    /* ✅ SAFE CAST (after middleware) */
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = user.id;

    const code = await generateNanoId(10);

    const redirectToInviter =
  req.body.redirectToInviter === true;

console.log(
  "redirectToInviter received:",
  req.body.redirectToInviter
);

const invite = await prisma.invite.create({
  data: {
    code,
    invitedById: userId,
    used: false,
    redirectToInviter,
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