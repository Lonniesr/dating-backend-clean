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
 * Invite statistics for logged in user
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
 * Top inviters
 */
router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {

    const leaderboard = await prisma.invite.groupBy({
      by: ["invitedById"],
      _count: {
        invitedById: true,
      },
      orderBy: {
        _count: {
          invitedById: "desc",
        },
      },
      take: 10,
    });

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: leaderboard
            .map((l) => l.invitedById)
            .filter((id): id is string => Boolean(id)),
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const result = leaderboard.map((entry) => {
      const user = users.find((u) => u.id === entry.invitedById);

      return {
        userId: entry.invitedById,
        name: user?.name || user?.email || "Unknown",
        invites: entry._count.invitedById,
      };
    });

    return res.json(result);

  } catch (err) {
    console.error("INVITE LEADERBOARD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
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
        ? "https://letslynq.com"
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