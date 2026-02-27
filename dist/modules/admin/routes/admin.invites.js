"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/invites/analytics
 */
router.get("/analytics", requireUser_1.requireUser, async (req, res) => {
    try {
        const invitesPerDay = await prisma_1.default.$queryRawUnsafe(`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Invite"
      WHERE "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `);
        const totalSent = await prisma_1.default.invite.count();
        const totalAccepted = await prisma_1.default.invite.count({
            where: { used: true },
        });
        const funnel = {
            sent: totalSent,
            accepted: totalAccepted,
            acceptanceRate: totalSent === 0
                ? 0
                : Number(((totalAccepted / totalSent) * 100).toFixed(2)),
        };
        return res.json({ invitesPerDay, funnel });
    }
    catch (err) {
        console.error("INVITE ANALYTICS ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
