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
 * GET /api/invite/stats
 */
router.get("/stats", requireUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const sent = await prisma.invite.count({
      where: {
        invitedById: userId,
      },
    });

    const joined = await prisma.invite.count({
      where: {
        invitedById: userId,
        used: true,
      },
    });

    return res.json({
      sent,
      joined,
    });

  } catch (err) {
    console.error("INVITE STATS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/invite/leaderboard
 */
router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {

    const invites = await prisma.invite.groupBy({
      by: ["invitedById"],
      where: {
        used: true,
        invitedById: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    const userIds = invites
      .map((i) => i.invitedById)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });

    const leaderboard = invites.map((entry) => {
      const user = users.find((u) => u.id === entry.invitedById);

      return {
        userId: entry.invitedById,
        name: user?.name || user?.username || "User",
        invites: entry._count.id,
      };
    });

    return res.json({ leaderboard });

  } catch (err) {
    console.error("INVITE LEADERBOARD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/invite/mutual/:targetUserId
 * Finds if two users share the same inviter
 */
router.get(
  "/mutual/:targetUserId",
  requireUser,
  async (req: any, res: Response) => {
    try {

      const userId = req.user.id;
      const { targetUserId } = req.params;

      const currentUserInvite = await prisma.invite.findFirst({
        where: {
          usedById: userId,
        },
      });

      const targetInvite = await prisma.invite.findFirst({
        where: {
          usedById: targetUserId,
        },
      });

      if (!currentUserInvite || !targetInvite) {
        return res.json({ mutual: false });
      }

      if (
        currentUserInvite.invitedById &&
        currentUserInvite.invitedById === targetInvite.invitedById
      ) {

        const inviter = await prisma.user.findUnique({
          where: { id: currentUserInvite.invitedById },
          select: {
            name: true,
            username: true,
          },
        });

        return res.json({
          mutual: true,
          inviter: inviter?.name || inviter?.username || "A friend",
        });
      }

      return res.json({ mutual: false });

    } catch (err) {
      console.error("MUTUAL INVITE ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * GET /api/invite/:code
 */
router.get("/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        User_Invite_invitedByIdToUser: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ reason: "not_found" });
    }

    if (invite.used) {
      return res.status(400).json({ reason: "used" });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ reason: "expired" });
    }

    return res.json({
      premium: invite.premium,
      expiresAt: invite.expiresAt,
      invitedBy: invite.User_Invite_invitedByIdToUser
        ? {
            username: invite.User_Invite_invitedByIdToUser.username,
            email: invite.User_Invite_invitedByIdToUser.email,
          }
        : null,
    });

  } catch (err) {
    console.error("INVITE FETCH ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/invite/:code/scan
 */
router.post("/:code/scan", async (req: Request, res: Response) => {
  try {

    const { code } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { code },
    });

    if (!invite) {
      return res.status(404).json({});
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        scanCount: { increment: 1 },
      },
    });

    await prisma.inviteScan.create({
      data: {
        inviteId: invite.id,
        device: req.headers["user-agent"] || null,
      },
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("INVITE SCAN ERROR:", err);
    return res.status(500).json({});
  }
});

/**
 * POST /api/invite
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