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
  const activeInvite = await prisma.invite.findFirst({
    where: {
      invitedById: userId,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (activeInvite) {
    return res.status(403).json({
      error:
        "You already have an active invite. Verify your profile for unlimited invites.",
    });
  }
}

    const code = await generateNanoId(10);

    const redirectToInviter =
  req.body.redirectToInviter === true;

console.log("BODY:", req.body);
console.log(
  "redirectToInviter received:",
  req.body?.redirectToInviter,
  typeof req.body?.redirectToInviter
);

const invite = await prisma.invite.create({
  data: {
    code,
    invitedById: userId,
    used: false,
    redirectToInviter,

    expiresAt: dbUser.verified
      ? null
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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