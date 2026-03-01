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
        const bannedUsers = await prisma_1.default.user.findMany({
            where: { banned: true },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ users: bannedUsers });
    }
    catch (err) {
        console.error("ADMIN BANS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
