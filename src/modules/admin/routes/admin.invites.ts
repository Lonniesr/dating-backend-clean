import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/admin/invites/analytics
 */
router.get("/analytics", requireUser, async (req, res) => {
  try {
    const invitesPerDay = await prisma.$queryRawUnsafe(`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Invite"
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `);

    const totalSent = await prisma.invite.count();

    const totalAccepted = await prisma.invite.count({
      where: { used: true },
    });

    const funnel = {
      sent: totalSent,
      accepted: totalAccepted,
      acceptanceRate:
        totalSent === 0
          ? 0
          : Number(((totalAccepted / totalSent) * 100).toFixed(2)),
    };

    return res.json({ invitesPerDay, funnel });
  } catch (err) {
    console.error("INVITE ANALYTICS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;