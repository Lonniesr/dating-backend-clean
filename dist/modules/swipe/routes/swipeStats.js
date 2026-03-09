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
 * GET /api/swipe/stats
 */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user.id;
        const [likesGiven, passesGiven, superLikesGiven, likesReceived] = await Promise.all([
            prisma_1.default.swipe.count({
                where: {
                    swiperId: userId,
                    liked: true
                }
            }),
            prisma_1.default.swipe.count({
                where: {
                    swiperId: userId,
                    liked: false
                }
            }),
            prisma_1.default.swipe.count({
                where: {
                    swiperId: userId,
                    superLike: true
                }
            }),
            prisma_1.default.swipe.count({
                where: {
                    targetId: userId,
                    liked: true
                }
            })
        ]);
        res.json({
            likesGiven,
            passesGiven,
            superLikesGiven,
            likesReceived
        });
    }
    catch (err) {
        console.error("SWIPE STATS ERROR:", err);
        res.status(500).json({
            message: "Failed to load swipe stats"
        });
    }
});
exports.default = router;
