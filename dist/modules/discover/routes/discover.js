"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma")); // ✅ FIXED
const requireUser_1 = require("../../../middleware/requireUser"); // ✅ FIXED
const router = (0, express_1.Router)();
/**
 * GET /api/discover
 * Returns swipe candidates for the logged-in user
 */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        // Users this user already swiped on
        const swipes = await prisma_1.default.swipe.findMany({
            where: { swiperId: userId },
            select: { targetId: true },
        });
        const swipedIds = swipes.map((s) => s.targetId);
        // Users already matched with this user
        const matches = await prisma_1.default.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            select: { userAId: true, userBId: true },
        });
        const matchedIds = matches
            .flatMap((m) => [m.userAId, m.userBId])
            .filter((id) => id !== userId);
        // Fetch candidates
        const candidates = await prisma_1.default.user.findMany({
            where: {
                id: {
                    not: userId,
                    notIn: [...swipedIds, ...matchedIds],
                },
                onboardingComplete: true,
                photos: { isEmpty: false },
            },
            select: {
                id: true,
                name: true,
                gender: true,
                photos: true,
                birthdate: true,
                location: true,
            },
            take: 20,
        });
        res.json(candidates);
    }
    catch (err) {
        console.error("DISCOVER ERROR:", err);
        res.status(500).json({ message: "Failed to load discover feed." });
    }
});
exports.default = router;
