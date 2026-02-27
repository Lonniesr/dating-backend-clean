import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
import { nanoid } from "nanoid";

const router = Router();

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    email: string;
    onboardingComplete: boolean;
    name: string | null;
    gender: string | null;
    preferences: any | null;
  };
};

/**
 * POST /api/user/invites
 * Logged-in users create their own invite
 */
router.post("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

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

    res.json({
      id: invite.id,
      code: invite.code,
      inviteLink,
    });

  } catch (error) {
    console.error("Create user invite error:", error);
    res.status(500).json({ error: "Failed to create invite" });
  }
});