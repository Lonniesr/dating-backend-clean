import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { nanoid } from "nanoid";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/invite/stats
 */
router.get("/stats", requireUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const sent = await prisma.invite.count({
      where: { invitedById: userId },
    });

    const joined = await prisma.invite.count({
      where: {
        invitedById: userId,
        used: true,
      },
    });

    return res.json({ sent, joined });

  } catch (err) {
    console.error("INVITE STATS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/invite/leaderboard
 */
router.get("/leaderboard", async (_req, res) => {
  try {

    const invites = await prisma.invite.groupBy({
      by: ["invitedById"],
      where: { used: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const userIds = invites
      .map(i => i.invitedById)
      .filter(Boolean) as string[];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true },
    });

    const leaderboard = invites.map(entry => {
      const user = users.find(u => u.id === entry.invitedById);

      return {
        userId: entry.invitedById,
        name: user?.name || user?.username || "User",
        invites: entry._count.id,
      };
    });

    res.json({ leaderboard });

  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({});
  }
});

/**
 * GET mutual invite relationship
 */
router.get("/mutual/:targetUserId", requireUser, async (req: any, res) => {
  try {

    const userId = req.user.id;
    const { targetUserId } = req.params;

    const currentInvite = await prisma.invite.findFirst({
      where: { usedById: userId },
    });

    const targetInvite = await prisma.invite.findFirst({
      where: { usedById: targetUserId },
    });

    if (!currentInvite || !targetInvite) {
      return res.json({ mutual: false });
    }

    if (currentInvite.invitedById === targetInvite.invitedById) {

      const inviter = await prisma.user.findUnique({
        where: { id: currentInvite.invitedById! },
        select: { name: true, username: true },
      });

      return res.json({
        mutual: true,
        inviter: inviter?.name || inviter?.username || "A friend",
      });
    }

    res.json({ mutual: false });

  } catch (err) {
    console.error("MUTUAL ERROR:", err);
    res.status(500).json({});
  }
});

/**
 * Invite landing validation
 */
router.get("/:code", async (req, res) => {
  try {

    const invite = await prisma.invite.findUnique({
      where: { code: req.params.code },
      include: {
        User_Invite_invitedByIdToUser: {
          select: { username: true, email: true },
        },
      },
    });

    if (!invite) return res.status(404).json({ reason: "not_found" });
    if (invite.used) return res.status(400).json({ reason: "used" });

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ reason: "expired" });
    }

    res.json({
      premium: invite.premium,
      expiresAt: invite.expiresAt,
      invitedBy: invite.User_Invite_invitedByIdToUser,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({});
  }
});

/**
 * Scan tracking
 */
router.post("/:code/scan", async (req, res) => {
  try {

    const invite = await prisma.invite.findUnique({
      where: { code: req.params.code },
    });

    if (!invite) return res.status(404).json({});

    await prisma.invite.update({
      where: { id: invite.id },
      data: { scanCount: { increment: 1 } },
    });

    await prisma.inviteScan.create({
      data: {
        inviteId: invite.id,
        device: req.headers["user-agent"] || null,
      },
    });

    res.json({ success: true });

  } catch {
    res.status(500).json({});
  }
});

/**
 * Generate invite
 */
router.post("/", requireUser, async (req: any, res) => {
  try {

    const code = nanoid(8);

    const invite = await prisma.invite.create({
      data: {
        code,
        invitedById: req.user.id,
      },
    });

    const frontendBase =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://lynq.app"
        : "http://localhost:5173");

    const inviteLink = `${frontendBase}/invite/${invite.code}`;

    res.json({
      id: invite.id,
      code: invite.code,
      inviteLink,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({});
  }
});

export default router;