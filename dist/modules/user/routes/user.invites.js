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
 * POST /api/user/invites
 * Logged-in users create their own invite
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = user.id;
        /* ✅ FIXED (NO STATIC IMPORT) */
        const { nanoid } = await import("nanoid");
        const code = nanoid(10);
        const invite = await prisma_1.default.invite.create({
            data: {
                code,
                invitedById: userId,
                used: false,
            },
        });
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const inviteLink = `${frontendUrl}/invite/${invite.code}`;
        return res.json({
            id: invite.id,
            code: invite.code,
            inviteLink,
        });
    }
    catch (error) {
        console.error("Create user invite error:", error);
        return res.status(500).json({ error: "Failed to create invite" });
    }
});
exports.default = router;
