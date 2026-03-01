"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../../config/env");
const router = (0, express_1.Router)();
/* =========================
   GET ALL INVITES
========================= */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        const invites = await prisma_1.default.invite.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                User_Invite_usedByIdToUser: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
        return res.json({ invites });
    }
    catch (err) {
        console.error("INVITE LIST ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/* =========================
   CREATE INVITE
========================= */
router.post("/", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const { email, expiresAt, premium } = req.body;
        const code = crypto_1.default.randomBytes(16).toString("hex");
        const invite = await prisma_1.default.invite.create({
            data: {
                code,
                email: email || null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                premium: Boolean(premium),
                invitedById: req.user.id,
            },
        });
        const frontendBase = env_1.env.NODE_ENV === "production"
            ? env_1.env.FRONTEND_URL
            : "http://localhost:5173";
        const inviteUrl = `${frontendBase}/invite/${code}`;
        return res.status(201).json({
            ...invite,
            inviteUrl,
        });
    }
    catch (err) {
        console.error("INVITE CREATE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
