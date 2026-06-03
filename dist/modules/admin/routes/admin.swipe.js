"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/swipe
 */
router.get("/", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const { cursor, limit = "50", from, to, liked, } = req.query;
        const take = Math.min(parseInt(limit, 10) || 50, 100);
        // 🔍 Build filters
        const where = {};
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(from);
            if (to)
                where.createdAt.lte = new Date(to);
        }
        if (liked === "true")
            where.liked = true;
        if (liked === "false")
            where.liked = false;
        // 📦 Fetch swipes
        const swipes = await prisma_1.default.swipe.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: take + 1,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            include: {
                swiper: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        email: true,
                        lastActiveAt: true, // 👈 ADD THIS
                        photos: {
                            select: {
                                url: true,
                            },
                        },
                    },
                },
                target: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        email: true,
                        lastActiveAt: true, // 👈 ADD THIS
                        photos: {
                            select: {
                                url: true,
                            },
                        },
                    },
                },
            },
        });
        // 🔥 GET ALL UNIQUE USER IDS
        const userIds = new Set();
        (swipes || []).forEach((s) => {
            var _a, _b;
            if ((_a = s.swiper) === null || _a === void 0 ? void 0 : _a.id)
                userIds.add(s.swiper.id);
            if ((_b = s.target) === null || _b === void 0 ? void 0 : _b.id)
                userIds.add(s.target.id);
        });
        // 🔄 Pagination
        let nextCursor = null;
        if (swipes.length > take) {
            const nextItem = swipes.pop();
            nextCursor = nextItem.id;
        }
        // 🔥 REAL MATCH COUNTS (from conversations)
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                OR: [
                    { userAId: { in: Array.from(userIds) } },
                    { userBId: { in: Array.from(userIds) } },
                ],
            },
            select: {
                userAId: true,
                userBId: true,
            },
        });
        const matchCounts = {};
        // 🔥 LAST 24H WINDOW
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // 🔥 24H MATCHES (TRENDING)
        const recentConversations = await prisma_1.default.conversation.findMany({
            where: {
                createdAt: {
                    gte: last24h,
                },
                OR: [
                    { userAId: { in: Array.from(userIds) } },
                    { userBId: { in: Array.from(userIds) } },
                ],
            },
            select: {
                userAId: true,
                userBId: true,
            },
        });
        const trendingCounts = {};
        recentConversations.forEach((c) => {
            trendingCounts[c.userAId] =
                (trendingCounts[c.userAId] || 0) + 1;
            trendingCounts[c.userBId] =
                (trendingCounts[c.userBId] || 0) + 1;
        });
        conversations.forEach((c) => {
            matchCounts[c.userAId] = (matchCounts[c.userAId] || 0) + 1;
            matchCounts[c.userBId] = (matchCounts[c.userBId] || 0) + 1;
        });
        // 🔧 Normalize response (WITH MATCHES + PHOTOS)
        const formatted = swipes.map((swipe) => ({
            id: swipe.id,
            liked: swipe.liked,
            superLike: swipe.superLike,
            createdAt: swipe.createdAt,
            swiper: swipe.swiper
                ? {
                    id: swipe.swiper.id,
                    username: swipe.swiper.username ||
                        swipe.swiper.name ||
                        "Unknown",
                    email: swipe.swiper.email,
                    photos: swipe.swiper.photos || [],
                    matches: matchCounts[swipe.swiper.id] || 0,
                    trending: trendingCounts[swipe.swiper.id] || 0,
                    lastActiveAt: swipe.swiper.lastActiveAt, // 👈 ADD
                }
                : null,
            target: swipe.target
                ? {
                    id: swipe.target.id,
                    username: swipe.target.username ||
                        swipe.target.name ||
                        "Unknown",
                    email: swipe.target.email,
                    photos: swipe.target.photos || [],
                    matches: matchCounts[swipe.target.id] || 0,
                    trending: trendingCounts[swipe.target.id] || 0,
                    lastActiveAt: swipe.target.lastActiveAt,
                }
                : null,
        }));
        // 📊 Analytics
        const totalCount = await prisma_1.default.swipe.count({ where });
        const likedCount = await prisma_1.default.swipe.count({
            where: { ...where, liked: true },
        });
        const likeRate = totalCount > 0 ? (likedCount / totalCount) * 100 : 0;
        const matchCount = await prisma_1.default.conversation.count();
        return res.json({
            swipes: formatted,
            nextCursor,
            analytics: {
                totalSwipes: totalCount,
                likedSwipes: likedCount,
                matches: matchCount, // ✅ REAL DATA
                likeRate: Number(likeRate.toFixed(2)),
            },
        });
    }
    catch (err) {
        console.error("ADMIN SWIPE ERROR:", err);
        return res.status(500).json({
            error: "Failed to fetch swipes",
        });
    }
});
exports.default = router;
