import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/dashboard
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* =========================
       KPI COUNTS
    ========================= */

    const [
      totalUsers,
      verifiedUsers,
      newUsersToday,
      newUsers30d,
      totalMatches,
      totalMessages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.match.count(),
      prisma.message.count(),
    ]);

    /* =========================
       DAILY SIGNUPS (30 DAYS)
    ========================= */

    const dailySignupsRaw = await prisma.$queryRawUnsafe<
      { date: Date; count: bigint }[]
    >(`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `);

    const dailySignups = dailySignupsRaw.map((row) => ({
      date: row.date,
      count: Number(row.count), // 🔥 convert BigInt → number
    }));

    /* =========================
       GENDER DISTRIBUTION
    ========================= */

    const genderDistributionRaw = await prisma.user.groupBy({
      by: ["gender"],
      _count: { gender: true },
    });

    const genderDistribution = genderDistributionRaw.map((g) => ({
      gender: g.gender,
      count: Number(g._count.gender),
    }));

    /* =========================
       ROLE DISTRIBUTION
    ========================= */

    const roleDistributionRaw = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    const roleDistribution = roleDistributionRaw.map((r) => ({
      role: r.role,
      count: Number(r._count.role),
    }));

    /* =========================
       INVITE ANALYTICS
    ========================= */

    const invitesPerDayRaw = await prisma.$queryRawUnsafe<
      { date: Date; count: bigint }[]
    >(`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Invite"
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `);

    const invitesPerDay = invitesPerDayRaw.map((row) => ({
      date: row.date,
      count: Number(row.count), // 🔥 convert BigInt
    }));

    const totalInvites = Number(await prisma.invite.count());
    const acceptedInvites = Number(
      await prisma.invite.count({
        where: { used: true },
      })
    );

    return res.json({
      kpis: {
        totalUsers: Number(totalUsers),
        verifiedUsers: Number(verifiedUsers),
        newUsersToday: Number(newUsersToday),
        newUsers30d: Number(newUsers30d),
        totalMatches: Number(totalMatches),
        totalMessages: Number(totalMessages),
      },
      dailySignups,
      genderDistribution,
      roleDistribution,
      inviteAnalytics: {
        invitesPerDay,
        funnel: {
          sent: totalInvites,
          accepted: acceptedInvites,
          acceptanceRate:
            totalInvites === 0
              ? 0
              : Number(
                  ((acceptedInvites / totalInvites) * 100).toFixed(2)
                ),
        },
      },
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;