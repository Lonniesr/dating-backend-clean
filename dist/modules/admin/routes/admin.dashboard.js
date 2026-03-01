"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/dashboard
 */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        /* =========================
           KPI COUNTS
        ========================= */
        const [totalUsers, verifiedUsers, newUsersToday, newUsers30d, totalMatches, totalMessages,] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { verified: true } }),
            prisma_1.default.user.count({ where: { createdAt: { gte: today } } }),
            prisma_1.default.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma_1.default.match.count(),
            prisma_1.default.message.count(),
        ]);
        /* =========================
           DAILY SIGNUPS (30 DAYS)
        ========================= */
        const dailySignupsRaw = await prisma_1.default.$queryRawUnsafe(`
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
        const genderDistributionRaw = await prisma_1.default.user.groupBy({
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
        const roleDistributionRaw = await prisma_1.default.user.groupBy({
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
        const invitesPerDayRaw = await prisma_1.default.$queryRawUnsafe(`
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
        const totalInvites = Number(await prisma_1.default.invite.count());
        const acceptedInvites = Number(await prisma_1.default.invite.count({
            where: { used: true },
        }));
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
                    acceptanceRate: totalInvites === 0
                        ? 0
                        : Number(((acceptedInvites / totalInvites) * 100).toFixed(2)),
                },
            },
        });
    }
    catch (err) {
        console.error("ADMIN DASHBOARD ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
