"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const totalSwipes = await prisma_1.default.swipe.count({
            where: { swiperId: userId }
        });
        const likesGiven = await prisma_1.default.swipe.count({
            where: { swiperId: userId, direction: "like" }
        });
        const likesReceived = await prisma_1.default.swipe.count({
            where: { targetId: userId, direction: "like" }
        });
        const matches = await prisma_1.default.match.count({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            }
        });
        const last7Days = await prisma_1.default.swipe.groupBy({
            by: ["createdAt"],
            where: {
                swiperId: userId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            _count: true
        });
        return res.json({
            totalSwipes,
            likesGiven,
            likesReceived,
            matches,
            activity: last7Days
        });
    }
    catch (err) {
        console.error("SWIPE STATS ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
