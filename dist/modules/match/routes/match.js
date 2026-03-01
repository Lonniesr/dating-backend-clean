"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
/**
 * Simple auth middleware
 * Assumes some earlier middleware attaches user to req
 */
function authMiddleware(req, res, next) {
    if (req.user)
        return next();
    return res.status(401).json({ error: "Unauthorized" });
}
/**
 * GET /api/user/matches
 * Returns all matches for the authenticated user
 */
router.get("/user/matches", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const matches = await prisma_1.default.match.findMany({
            where: {
                OR: [
                    { userAId: user.id },
                    { userBId: user.id }
                ]
            },
            orderBy: { createdAt: "desc" },
            include: {
                userA: true,
                userB: true
            }
        });
        return res.json(matches);
    }
    catch (err) {
        console.error("MATCH LIST ERROR:", err);
        return res.status(500).json({ error: "Failed to load matches" });
    }
});
exports.default = router;
