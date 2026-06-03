"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const redis_1 = __importDefault(require("../../../redis"));
const requireUser_1 = require("../../../middleware/requireUser");
const elo_1 = require("../../../utils/elo"); // ✅ NEW
const router = (0, express_1.Router)();
/**
 * POST /api/swipe
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    var _a, _b;
    try {
        const swiperId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!swiperId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { targetId, liked, superLike } = req.body;
        if (!targetId || typeof targetId !== "string") {
            return res.status(400).json({ error: "Invalid targetId" });
        }
        if (targetId === swiperId) {
            return res.status(400).json({ error: "Cannot swipe yourself" });
        }
        const isLiked = liked === true;
        const isSuperLike = superLike === true;
        /* ===============================
           HANDLE SUPER LIKE LIMIT
        =============================== */
        if (isSuperLike) {
            const user = await prisma_1.default.user.findUnique({
                where: { id: swiperId },
                select: {
                    superLikesRemaining: true,
                    superLikesResetAt: true,
                },
            });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            let remaining = (_b = user.superLikesRemaining) !== null && _b !== void 0 ? _b : 0;
            const now = new Date();
            if (user.superLikesResetAt && now > user.superLikesResetAt) {
                remaining = 3;
                await prisma_1.default.user.update({
                    where: { id: swiperId },
                    data: {
                        superLikesRemaining: 3,
                        superLikesResetAt: new Date(now.getTime() + 86400000),
                    },
                });
            }
            if (remaining <= 0) {
                return res.status(403).json({
                    error: "No super likes remaining",
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
        /* ===============================
           PREVENT DUPLICATE SWIPES
        =============================== */
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
                    liked: isLiked,
                    superLike: isSuperLike,
                },
            });
        }
        /* ===============================
           ELO RANKING UPDATE (FIXED)
        =============================== */
        const [swiper, target] = await Promise.all([
            prisma_1.default.user.findUnique({
                where: { id: swiperId },
                select: { eloScore: true, role: true },
            }),
            prisma_1.default.user.findUnique({
                where: { id: targetId },
                select: { eloScore: true, role: true },
            }),
        ]);
        // 🔐 prevent admin / invalid targets
        if (!target || target.role !== "user") {
            return res.status(400).json({ error: "Invalid target" });
        }
        if (swiper && target) {
            const result = isLiked ? 1 : 0;
            const newSwiperElo = (0, elo_1.calculateElo)(swiper.eloScore, target.eloScore, result);
            const newTargetElo = (0, elo_1.calculateElo)(target.eloScore, swiper.eloScore, isLiked ? 1 : 0);
            await prisma_1.default.$transaction([
                prisma_1.default.user.update({
                    where: { id: swiperId },
                    data: { eloScore: newSwiperElo },
                }),
                prisma_1.default.user.update({
                    where: { id: targetId },
                    data: { eloScore: newTargetElo },
                }),
            ]);
        }
        /* ===============================
           CHECK RECIPROCAL LIKE
        =============================== */
        let isMatch = false;
        if (isLiked) {
            const reciprocal = await prisma_1.default.swipe.findFirst({
                where: {
                    swiperId: targetId,
                    targetId: swiperId,
                    liked: true,
                },
            });
            if (reciprocal) {
                const [userAId, userBId] = swiperId < targetId
                    ? [swiperId, targetId]
                    : [targetId, swiperId];
                const existingMatch = await prisma_1.default.match.findFirst({
                    where: {
                        userAId,
                        userBId,
                    },
                });
                if (!existingMatch) {
                    await prisma_1.default.match.create({
                        data: {
                            userAId,
                            userBId,
                        },
                    });
                    await prisma_1.default.notification.create({
                        data: {
                            userId: targetId,
                            type: "match",
                            actorId: swiperId,
                        },
                    });
                }
                isMatch = true;
            }
        }
        /* ===============================
           DISCOVER CACHE INVALIDATION
        =============================== */
        if (redis_1.default) {
            await redis_1.default.del(`discover:${swiperId}`);
            await redis_1.default.del(`discover:${targetId}`);
        }
        return res.json({
            success: true,
            isMatch,
        });
    }
    catch (err) {
        console.error("SWIPE ERROR:", err);
        return res.status(500).json({
            error: "Swipe failed",
        });
    }
});
exports.default = router;
