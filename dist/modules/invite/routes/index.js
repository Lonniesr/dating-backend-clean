"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const nanoid_1 = require("nanoid");
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/**
 * GET /api/invite
 * Test route
 */
router.get("/", (req, res) => {
    res.json({ message: "Invite route working" });
});
/**
 * GET /api/invite/stats
 * Invite statistics for logged in user
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
 * Top inviters
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
 * Generate invite
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body || {};
        const premium = Boolean(body.premium);
        const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
        const code = (0, nanoid_1.nanoid)(8);
        let expiresAt = null;
        if (expiresInDays) {
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
