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
 * GET /api/invite
 */
router.get("/", (req, res) => {
    res.json({ message: "Invite route working" });
});
/**
 * GET /api/invite/stats
 */
router.get("/stats", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const sent = await prisma_1.default.invite.count({
            where: { invitedById: userId },
        });
        const joined = await prisma_1.default.invite.count({
            where: {
                invitedById: userId,
                used: true,
            },
        });
        return res.json({
            sent,
            joined,
        });
    }
    catch (err) {
        console.error("INVITE STATS ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/**
 * GET /api/invite/leaderboard
 */
router.get("/leaderboard", async (_req, res) => {
    try {
        const leaderboard = await prisma_1.default.invite.groupBy({
            by: ["invitedById"],
            _count: {
                invitedById: true,
            },
            orderBy: {
                _count: {
                    invitedById: "desc",
                },
            },
            take: 10,
        });
        const users = await prisma_1.default.user.findMany({
            where: {
                id: {
                    in: leaderboard
                        .map((l) => l.invitedById)
                        .filter((id) => Boolean(id)),
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        const result = leaderboard.map((entry) => {
            const user = users.find((u) => u.id === entry.invitedById);
            return {
                userId: entry.invitedById,
                name: (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.email) || "Unknown",
                invites: entry._count.invitedById,
            };
        });
        return res.json(result);
    }
    catch (err) {
        console.error("INVITE LEADERBOARD ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/**
 * POST /api/invite
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body || {};
        const premium = Boolean(body.premium);
        const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
        /* ✅ FIX (ONLY CHANGE THAT MATTERS) */
        const { nanoid } = await import("nanoid");
        const code = nanoid(8);
        let expiresAt = null;
        if (premium) {
            expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
        }
        else if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }
        const invite = await prisma_1.default.invite.create({
            data: {
                code,
                premium,
                invitedById: userId,
                expiresAt,
                used: false,
                maxUses: premium ? null : 1,
                usedCount: 0,
            },
        });
        const frontendBase = process.env.FRONTEND_URL ||
            (process.env.NODE_ENV === "production"
                ? "https://letslynq.com"
                : "http://localhost:5173");
        const inviteLink = `${frontendBase}/invite/${invite.code}`;
        return res.json({
            id: invite.id,
            code: invite.code,
            inviteLink,
            premium: invite.premium,
            expiresAt: invite.expiresAt,
        });
    }
    catch (err) {
        console.error("INVITE CREATE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
