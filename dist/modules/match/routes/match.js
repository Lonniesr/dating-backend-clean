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
 * GET /api/user/matches
 * Returns normalized match list for logged-in user
 */
router.get("/user/matches", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const matches = await prisma_1.default.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            orderBy: { createdAt: "desc" },
            include: {
                userA: {
                    select: {
                        id: true,
                        name: true,
                        gender: true,
                        race: true,
                        photos: true,
                        birthdate: true,
                        location: true,
                    },
                },
                userB: {
                    select: {
                        id: true,
                        name: true,
                        gender: true,
                        race: true,
                        photos: true,
                        birthdate: true,
                        location: true,
                    },
                },
            },
        });
        // Normalize so frontend always gets "otherUser"
        const normalizedMatches = matches.map((match) => {
            const otherUser = match.userAId === userId ? match.userB : match.userA;
            return {
                id: match.id,
                createdAt: match.createdAt,
                user: otherUser,
            };
        });
        return res.json(normalizedMatches);
    }
    catch (err) {
        console.error("MATCH LIST ERROR:", err);
        return res.status(500).json({ error: "Failed to load matches" });
    }
});
exports.default = router;
