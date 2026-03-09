"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const date_fns_1 = require("date-fns");
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/**
 * GET /api/stats
 * Platform analytics
 */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const weekAgo = (0, date_fns_1.subDays)(today, 7);
        // -------- USERS --------
        const totalUsers = await prisma_1.default.user.count();
        const newUsersToday = await prisma_1.default.user.count({
            where: {
                createdAt: { gte: today },
            },
        });
        const newUsersWeek = await prisma_1.default.user.count({
            where: {
                createdAt: { gte: weekAgo },
            },
        });
        // -------- ACTIVITY --------
        const swipesToday = await prisma_1.default.swipe.count({
            where: {
                createdAt: { gte: today },
            },
        });
        const matchesToday = await prisma_1.default.match.count({
            where: {
                createdAt: { gte: today },
            },
        });
        // -------- TOTALS --------
        const totalMatches = await prisma_1.default.match.count();
        const totalMessages = await prisma_1.default.message.count();
        const totalSwipes = await prisma_1.default.swipe.count();
        // -------- MATCH RATE --------
        const matchRate = totalSwipes > 0 ? ((totalMatches / totalSwipes) * 100).toFixed(2) : 0;
        // -------- GENDER DISTRIBUTION --------
        const genderDistribution = (await prisma_1.default.user
            .groupBy({
            by: ["gender"],
            _count: {
                gender: true,
            },
        })
            .catch(() => [])) || [];
        return res.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    newToday: newUsersToday,
                    newWeek: newUsersWeek,
                },
                activity: {
                    swipesToday,
                    matchesToday,
                },
                totals: {
                    matches: totalMatches,
                    messages: totalMessages,
                    swipes: totalSwipes,
                },
                matchRate,
                distribution: {
                    gender: genderDistribution,
                },
            },
        });
    }
    catch (err) {
        console.error("GET /stats error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});
exports.default = router;
