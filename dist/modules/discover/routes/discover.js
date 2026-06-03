"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const redis_1 = __importDefault(require("../../../redis"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
const DISCOVER_CACHE_TTL = 60;
const PAGE_SIZE = 30;
const BUFFER_SIZE = 120;
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
router.get("/", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const cursor = Number(req.query.cursor || 0);
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                preferences: true,
                latitude: true,
                longitude: true,
            },
        });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const prefs = currentUser.preferences &&
            typeof currentUser.preferences === "object"
            ? currentUser.preferences
            : {};
        const interested = (prefs.interestedIn || "").toLowerCase();
        const cacheKey = `discover:${userId}:${cursor}:${interested}`;
        if (redis_1.default) {
            const cached = await redis_1.default.get(cacheKey);
            if (cached) {
                return res.json(JSON.parse(cached));
            }
        }
        const onlyVerified = prefs.onlyVerified === true;
        const anyLocation = prefs.locationRadius === null;
        const boostVerified = prefs.boostVerified === true;
        const prioritizeLikedYou = prefs.prioritizeLikedYou === true;
        const swipeData = await prisma_1.default.swipe.findMany({
            where: {
                OR: [{ swiperId: userId }, { targetId: userId }],
            },
            select: {
                swiperId: true,
                targetId: true,
                liked: true,
            },
        });
        const swipedIds = new Set();
        const likedYouSet = new Set();
        for (const s of swipeData) {
            if (s.swiperId === userId) {
                swipedIds.add(s.targetId);
            }
            if (s.targetId === userId && s.liked) {
                likedYouSet.add(s.swiperId);
            }
        }
        const matches = await prisma_1.default.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            select: { userAId: true, userBId: true },
        });
        const matchedIds = new Set();
        for (const m of matches) {
            if (m.userAId !== userId)
                matchedIds.add(m.userAId);
            if (m.userBId !== userId)
                matchedIds.add(m.userBId);
        }
        const blocks = await prisma_1.default.block.findMany({
            where: {
                OR: [{ blockerId: userId }, { blockedId: userId }],
            },
            select: {
                blockerId: true,
                blockedId: true,
            },
        });
        const blockedIds = new Set();
        for (const b of blocks) {
            if (b.blockerId === userId)
                blockedIds.add(b.blockedId);
            if (b.blockedId === userId)
                blockedIds.add(b.blockerId);
        }
        const excludedIds = [
            ...Array.from(swipedIds),
            ...Array.from(matchedIds),
            ...Array.from(blockedIds),
        ].slice(0, 500);
        const candidates = await prisma_1.default.user.findMany({
            where: {
                id: {
                    not: userId,
                    notIn: excludedIds,
                },
                role: "user",
                onboardingComplete: true,
                banned: false,
                photos: { some: {} },
                ...(onlyVerified && {
                    verified: true,
                }),
                ...(interested === "men" && {
                    gender: {
                        in: ["male", "Male", "man", "Man"],
                    },
                }),
                ...(interested === "women" && {
                    gender: {
                        in: ["female", "Female", "woman", "Woman"],
                    },
                }),
            },
            select: {
                id: true,
                name: true,
                gender: true,
                race: true,
                birthdate: true,
                location: true,
                latitude: true,
                longitude: true,
                lastActiveAt: true,
                eloScore: true,
                verified: true,
                preferences: true,
                photos: {
                    select: { url: true },
                    orderBy: { order: "asc" },
                },
            },
            take: 300,
        });
        const ranked = candidates
            .filter((user) => {
            var _a, _b;
            const theirPrefs = user.preferences && typeof user.preferences === "object"
                ? user.preferences
                : {};
            const theirInterested = (theirPrefs.interestedIn || "").toLowerCase();
            if (interested === "women") {
                return (((_a = user.gender) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "female" &&
                    (theirInterested === "men" || theirInterested === "everyone"));
            }
            if (interested === "men") {
                return (((_b = user.gender) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "male" &&
                    (theirInterested === "women" || theirInterested === "everyone"));
            }
            return true;
        })
            .map((user) => {
            var _a;
            let score = 0;
            if (likedYouSet.has(user.id)) {
                score += prioritizeLikedYou ? 1000 : 500;
            }
            if (boostVerified && user.verified) {
                score += 80;
            }
            if (prefs.interestedIn && prefs.interestedIn !== "Everyone") {
                if ((interested === "men" && user.gender === "male") ||
                    (interested === "women" && user.gender === "female")) {
                    score += 50;
                }
                else {
                    score -= 40;
                }
            }
            if (user.birthdate) {
                const age = new Date().getFullYear() -
                    new Date(user.birthdate).getFullYear();
                if (prefs.minAge && age < prefs.minAge)
                    score -= 50;
                if (prefs.maxAge && age > prefs.maxAge)
                    score -= 50;
                if ((!prefs.minAge || age >= prefs.minAge) &&
                    (!prefs.maxAge || age <= prefs.maxAge)) {
                    score += 40;
                }
            }
            if (user.lastActiveAt) {
                const hours = (Date.now() - new Date(user.lastActiveAt).getTime()) /
                    (1000 * 60 * 60);
                score += Math.max(0, 100 - hours);
            }
            score += (((_a = user.photos) === null || _a === void 0 ? void 0 : _a.length) || 0) * 10;
            score += user.eloScore * 0.05;
            if (!anyLocation &&
                currentUser.latitude &&
                currentUser.longitude &&
                user.latitude &&
                user.longitude) {
                const dist = calculateDistance(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude);
                score += Math.max(0, 50 - dist);
            }
            score += Math.random() * 10;
            return { ...user, score };
        })
            .sort((a, b) => b.score - a.score);
        // ⭐ TOP PICKS INJECTION
        const topPicks = [...ranked]
            .sort((a, b) => (b.eloScore || 0) - (a.eloScore || 0))
            .slice(0, 3);
        const remaining = ranked.filter((u) => !topPicks.some((tp) => tp.id === u.id));
        const finalFeed = [...topPicks, ...remaining];
        const windowed = finalFeed.slice(cursor, cursor + BUFFER_SIZE);
        const profiles = windowed.slice(0, PAGE_SIZE).map((u) => {
            var _a;
            return ({
                id: u.id,
                name: u.name,
                gender: u.gender,
                race: u.race,
                birthdate: u.birthdate,
                location: u.location,
                latitude: u.latitude,
                longitude: u.longitude,
                // 🔥 ONLINE STATUS
                lastActiveAt: u.lastActiveAt,
                photos: ((_a = u.photos) !== null && _a !== void 0 ? _a : []).map((p) => p.url),
            });
        });
        const response = {
            profiles,
            nextCursor: cursor + PAGE_SIZE,
        };
        if (redis_1.default) {
            await redis_1.default.set(cacheKey, JSON.stringify(response), {
                EX: DISCOVER_CACHE_TTL,
            });
        }
        return res.json(response);
    }
    catch (err) {
        console.error("DISCOVER ERROR:", err);
        return res.status(500).json({
            message: "Failed to load discover feed",
        });
    }
});
exports.default = router;
