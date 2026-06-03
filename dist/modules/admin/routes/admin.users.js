"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const router = (0, express_1.Router)();
/* =========================
   GET /api/admin/users
========================= */
router.get("/", requireAdmin_1.requireAdmin, async (req, res) => {
    var _a;
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) || 1 : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) || 20 : 20;
        const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        let where = {};
        if (search) {
            where = {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { name: { contains: search, mode: "insensitive" } },
                    { username: { contains: search, mode: "insensitive" } },
                ],
            };
        }
        const users = await prisma_1.default.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                role: true,
                verified: true,
                banned: true,
                createdAt: true,
                lastActiveAt: true,
            },
        });
        const total = await prisma_1.default.user.count({ where });
        return res.json({
            users,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    }
    catch (err) {
        console.error("ADMIN USER LIST ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/* =========================
   GET /api/admin/users/:id
========================= */
router.get("/:id", requireAdmin_1.requireAdmin, async (req, res) => {
    var _a, _b;
    try {
        const userId = req.params.id;
        console.log("🔍 Fetching admin user:", userId);
        /* =========================
           GET USER
        ========================= */
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        console.log("🔥 RAW USER FROM PRISMA:", user);
        /* =========================
           CALCULATE AGE
        ========================= */
        let age = null;
        if (user.birthdate) {
            const birth = new Date(user.birthdate);
            const today = new Date();
            age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
        }
        /* =========================
           DERIVE LOCATION (coords)
        ========================= */
        let location = null;
        if (user.latitude && user.longitude) {
            location = `${user.latitude}, ${user.longitude}`;
        }
        /* =========================
           GET PHOTOS
        ========================= */
        const photos = await prisma_1.default.photo.findMany({
            where: { userId },
            select: { url: true },
        });
        console.log("🔥 PHOTOS:", photos);
        /* =========================
           GET MATCHES
        ========================= */
        const matchesRaw = await prisma_1.default.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            include: {
                userA: { select: { id: true, name: true } },
                userB: { select: { id: true, name: true } },
            },
        });
        console.log("🔥 MATCHES RAW:", matchesRaw);
        const matches = matchesRaw.map((m) => {
            const isUserA = m.userAId === userId;
            return {
                id: m.id,
                otherUserId: isUserA ? m.userB.id : m.userA.id,
                otherUserName: isUserA
                    ? m.userB.name || "User"
                    : m.userA.name || "User",
                createdAt: m.createdAt,
            };
        });
        /* =========================
           FINAL RESPONSE
        ========================= */
        const formatted = {
            id: user.id,
            name: user.name || user.username || "Unnamed User",
            username: user.username,
            email: user.email,
            createdAt: (_a = user.createdAt) !== null && _a !== void 0 ? _a : new Date().toISOString(),
            lastActiveAt: (_b = user.lastActiveAt) !== null && _b !== void 0 ? _b : null,
            verified: user.verified,
            banned: user.banned,
            role: user.role,
            age,
            location,
            photos: (photos === null || photos === void 0 ? void 0 : photos.map((p) => p.url)) || [],
            matches: matches || [],
        };
        console.log("✅ FINAL RESPONSE:", formatted);
        return res.json(formatted);
    }
    catch (err) {
        console.error("ADMIN USER DETAIL ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
