import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";
import crypto from "crypto";
import { env } from "../../../config/env";

const router = Router();

/* =========================
   GET ALL INVITES
========================= */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User_Invite_usedByIdToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json({ invites });
  } catch (err) {
    console.error("INVITE LIST ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   CREATE INVITE
========================= */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { email, expiresAt, premium } = req.body;

    const code = crypto.randomBytes(16).toString("hex");

    const invite = await prisma.invite.create({
      data: {
        code,
        email: email || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        premium: Boolean(premium),
        invitedById: req.user!.id,
      },
    });

    const frontendBase =
      env.NODE_ENV === "production"
        ? env.FRONTEND_URL
        : "http://localhost:5173";

    const inviteUrl = `${frontendBase}/invite/${code}`;

    return res.status(201).json({
      ...invite,
      inviteUrl,
    });
  } catch (err) {
    console.error("INVITE CREATE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;