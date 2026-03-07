import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { nanoid } from "nanoid";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/invite
 * Test route
 */
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Invite route working" });
});

/**
 * POST /api/invite
 * Generate invite
 */
router.post("/", requireUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const body = req.body || {};
    const premium = Boolean(body.premium);
    const expiresInDays =
      typeof body.expiresInDays === "number" ? body.expiresInDays : null;

    const code = nanoid(8);

    let expiresAt: Date | null = null;

    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const invite = await prisma.invite.create({
      data: {
        code,
        premium,
        invitedById: userId,
        expiresAt,
        used: false,
      },
    });

    const frontendBase =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://lynq.app"
        : "http://localhost:5173");

    const inviteLink = `${frontendBase}/invite/${invite.code}`;

    return res.json({
      id: invite.id,
      code: invite.code,
      inviteLink,
      premium: invite.premium,
      expiresAt: invite.expiresAt,
    });

  } catch (err) {
    console.error("INVITE CREATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;