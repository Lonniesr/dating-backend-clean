"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
/**
 * GET /api/admin/bans
 */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            where: { banned: true },
            select: {
                id: true,
                email: true,
                name: true,
                bannedAt: true,
                banReason: true,
                banExpiresAt: true,
            },
            orderBy: { bannedAt: "desc" },
        });
        res.json({ users });
    }
    catch (err) {
        console.error("ADMIN BANS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * POST /api/admin/bans/:userId
 */
router.post("/:userId", requireAdmin_1.requireAdmin, async (req, res) => {
    var _a;
    try {
        const userIdParam = req.params.userId;
        const userId = Array.isArray(userIdParam)
            ? userIdParam[0]
            : userIdParam;
        if (!userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const { reason, durationHours } = req.body;
        const now = new Date();
        const banExpiresAt = durationHours && durationHours > 0
            ? new Date(now.getTime() + durationHours * 60 * 60 * 1000)
            : null;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                banned: true,
                banReason: reason || "Violation of guidelines",
                bannedAt: now,
                bannedBy: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "admin",
                banExpiresAt,
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId,
                type: "admin",
                content: `Your account has been banned. Reason: ${reason || "Violation of guidelines"}`,
            },
        });
        return res.json({ success: true, user });
    }
    catch (err) {
        console.error("BAN USER ERROR:", err);
        res.status(500).json({ error: "Failed to ban user" });
    }
});
/**
 * DELETE /api/admin/bans/:userId
 */
router.delete("/:userId", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const userIdParam = req.params.userId;
        const userId = Array.isArray(userIdParam)
            ? userIdParam[0]
            : userIdParam;
        if (!userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                banned: false,
                banReason: null,
                bannedAt: null,
                bannedBy: null,
                banExpiresAt: null,
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId,
                type: "admin",
                content: "Your account has been unbanned.",
            },
        });
        return res.json({ success: true, user });
    }
    catch (err) {
        console.error("UNBAN USER ERROR:", err);
        res.status(500).json({ error: "Failed to unban user" });
    }
});
exports.default = router;
