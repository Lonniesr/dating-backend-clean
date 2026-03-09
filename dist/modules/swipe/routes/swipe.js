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
 * POST /api/swipe
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const swiperId = req.user.id;
        const { targetId, liked, superLike } = req.body;
        if (!targetId) {
            return res.status(400).json({ message: "Missing targetId" });
        }
        if (targetId === swiperId) {
            return res.status(400).json({ message: "Cannot swipe yourself" });
        }
        const isSuperLike = superLike === true;
        /**
         * Handle super like limits
         */
        if (isSuperLike) {
            const user = await prisma_1.default.user.findUnique({
                where: { id: swiperId },
                select: {
                    superLikesRemaining: true,
                    superLikesResetAt: true,
                },
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            let remaining = (_a = user.superLikesRemaining) !== null && _a !== void 0 ? _a : 0;
            let resetAt = user.superLikesResetAt;
            const now = new Date();
            if (resetAt && now > resetAt) {
                remaining = 3;
                await prisma_1.default.user.update({
                    where: { id: swiperId },
                    data: {
                        superLikesRemaining: 3,
                        superLikesResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
                    },
                });
            }
            if (remaining <= 0) {
                return res.status(403).json({
                    message: "No super likes remaining",
                });
            }
            await prisma_1.default.user.update({
                where: { id: swiperId },
                data: {
                    superLikesRemaining: {
                        decrement: 1,
                    },
                },
            });
        }
        /**
         * Prevent duplicate swipe
         */
        const existingSwipe = await prisma_1.default.swipe.findUnique({
            where: {
                swiperId_targetId: {
                    swiperId,
                    targetId,
                },
            },
        });
        if (!existingSwipe) {
            await prisma_1.default.swipe.create({
                data: {
                    swiperId,
                    targetId,
                    liked: liked === true,
                    superLike: isSuperLike,
                },
            });
        }
        /**
         * Check reciprocal swipe
         */
        const reciprocal = await prisma_1.default.swipe.findFirst({
            where: {
                swiperId: targetId,
                targetId: swiperId,
                liked: true,
            },
        });
        let isMatch = false;
        if (liked === true && reciprocal) {
            const existingMatch = await prisma_1.default.match.findFirst({
                where: {
                    OR: [
                        {
                            userAId: swiperId,
                            userBId: targetId,
                        },
                        {
                            userAId: targetId,
                            userBId: swiperId,
                        },
                    ],
                },
            });
            if (!existingMatch) {
                await prisma_1.default.match.create({
                    data: {
                        userAId: swiperId,
                        userBId: targetId,
                    },
                });
            }
            isMatch = true;
        }
        res.json({
            success: true,
            isMatch,
        });
    }
    catch (err) {
        console.error("SWIPE ERROR:", err);
        res.status(500).json({
            message: "Swipe failed",
        });
    }
});
exports.default = router;
