"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("THIS IS THE REAL INVITE ROUTE FILE");
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const nanoid_1 = require("nanoid");
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
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
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            throw new Error("FRONTEND_URL not defined");
        }
        const inviteLink = `${frontendUrl}/invite/${invite.code}`;
        return res.json({
            code: invite.code,
            inviteLink, // ✅ THIS is what you were missing
            premium: invite.premium,
            expiresAt: invite.expiresAt,
        });
    }
    catch (err) {
        console.error("INVITE CREATE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
