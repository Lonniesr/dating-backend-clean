"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    var _a;
    try {
        const { email, password, inviteCode, } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const existing = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(400).json({ error: "Email already in use" });
        }
        let invite = null;
        // 🔥 Validate invite if provided
        if (inviteCode) {
            invite = await prisma_1.default.invite.findUnique({
                where: { code: inviteCode },
            });
            if (!invite) {
                return res.status(400).json({ error: "Invalid invite code" });
            }
            if (invite.used) {
                return res.status(400).json({ error: "Invite already used" });
            }
            if (invite.expiresAt && invite.expiresAt < new Date()) {
                return res.status(400).json({ error: "Invite expired" });
            }
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hash,
                inviteCode: (_a = invite === null || invite === void 0 ? void 0 : invite.code) !== null && _a !== void 0 ? _a : null,
            },
            select: {
                id: true,
                email: true,
                role: true,
                onboardingComplete: true,
                createdAt: true,
            },
        });
        // 🔥 If invite used → update analytics
        if (invite) {
            await prisma_1.default.invite.update({
                where: { id: invite.id },
                data: {
                    used: true,
                    usedAt: new Date(),
                    usedById: user.id,
                    signupCount: { increment: 1 },
                },
            });
        }
        return res.status(201).json({ user });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
