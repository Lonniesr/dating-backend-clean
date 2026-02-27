console.log("THIS IS THE REAL INVITE ROUTE FILE");
import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { nanoid } from "nanoid";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

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

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error("FRONTEND_URL not defined");
    }

    const inviteLink = `${frontendUrl}/invite/${invite.code}`;

    return res.json({
      code: invite.code,
      inviteLink, // ✅ THIS is what you were missing
      premium: invite.premium,
      expiresAt: invite.expiresAt,
    });

  } catch (err) {
    console.error("INVITE CREATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});