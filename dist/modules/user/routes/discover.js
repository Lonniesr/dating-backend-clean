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
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.id;
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                gender: true,
                preferences: true,
                birthdate: true,
            },
        });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const prefs = typeof currentUser.preferences === "string"
            ? JSON.parse(currentUser.preferences)
            : currentUser.preferences;
        const swipes = await prisma_1.default.swipe.findMany({
            where: { swiperId: userId },
            select: { targetId: true },
        });
        const swipedIds = swipes.map((s) => s.targetId);
        const matches = await prisma_1.default.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            select: { userAId: true, userBId: true },
        });
        const matchedIds = matches
            .flatMap((m) => [m.userAId, m.userBId])
            .filter((id) => id !== userId);
        let minBirthdate;
        let maxBirthdate;
        if (prefs === null || prefs === void 0 ? void 0 : prefs.minAge) {
            const d = new Date();
            d.setFullYear(d.getFullYear() - prefs.minAge);
            maxBirthdate = d;
        }
        if (prefs === null || prefs === void 0 ? void 0 : prefs.maxAge) {
            const d = new Date();
            d.setFullYear(d.getFullYear() - prefs.maxAge);
            minBirthdate = d;
        }
        const candidates = await prisma_1.default.user.findMany({
            where: {
                id: {
                    not: userId,
                    notIn: [...swipedIds, ...matchedIds],
                },
                onboardingComplete: true,
                photos: {
                    some: {},
                },
                ...((prefs === null || prefs === void 0 ? void 0 : prefs.interestedIn) && prefs.interestedIn !== "everyone"
                    ? { gender: prefs.interestedIn }
                    : {}),
                ...(minBirthdate || maxBirthdate
                    ? {
                        birthdate: {
                            ...(minBirthdate ? { gte: minBirthdate } : {}),
                            ...(maxBirthdate ? { lte: maxBirthdate } : {}),
                        },
                    }
                    : {}),
            },
            select: {
                id: true,
                name: true,
                gender: true,
                birthdate: true,
                location: true,
                bio: true,
                photos: {
                    orderBy: { order: "asc" },
                    select: { url: true },
                },
            },
            take: 20,
        });
        res.json({
            success: true,
            results: candidates.map((c) => ({
                ...c,
                photos: c.photos.map((p) => p.url),
            })),
        });
    }
    catch (err) {
        console.error("DISCOVER ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load discover feed.",
        });
    }
});
exports.default = router;
