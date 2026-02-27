"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma")); // ✅ FIXED
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const today = (0, date_fns_1.startOfDay)(new Date());
        const weekAgo = (0, date_fns_1.subDays)(today, 7);
        const totalUsers = await prisma_1.default.user.count();
        const newUsersToday = await prisma_1.default.user.count({
            where: { createdAt: { gte: today } },
        });
        const newUsersWeek = await prisma_1.default.user.count({
            where: { createdAt: { gte: weekAgo } },
        });
        const totalMatches = await prisma_1.default.match.count();
        const totalMessages = await prisma_1.default.message.count();
        const totalSwipes = await prisma_1.default.swipe.count();
        const genderDistribution = (await prisma_1.default.user
            .groupBy({
            by: ["gender"],
            _count: { gender: true },
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
                matches: totalMatches,
                messages: totalMessages,
                swipes: totalSwipes,
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
exports.default = router; // ✅ FIXED
