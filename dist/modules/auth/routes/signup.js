"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../../prisma"));
const env_1 = require("../../../config/env");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    const { email, password, invite } = req.body;
    try {
        if (!email || !password || !invite) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        const inviteRecord = await prisma_1.default.invite.findUnique({
            where: { code: invite },
        });
        if (!inviteRecord) {
            return res.status(400).json({ reason: "not_found" });
        }
        if (inviteRecord.used) {
            return res.status(400).json({ reason: "used" });
        }
        if (inviteRecord.expiresAt && inviteRecord.expiresAt < new Date()) {
            return res.status(400).json({ reason: "expired" });
        }
        const existing = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(400).json({ message: "Email already registered." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                onboardingComplete: false,
                role: "user", // default role
            },
            select: {
                id: true,
                email: true,
                role: true,
                onboardingComplete: true,
            },
        });
        await prisma_1.default.invite.update({
            where: { id: inviteRecord.id },
            data: {
                used: true,
                usedAt: new Date(),
                usedById: user.id,
            },
        });
        // ✅ STANDARDIZED JWT STRUCTURE
        const token = jsonwebtoken_1.default.sign({
            sub: user.id,
            role: user.role,
        }, env_1.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: env_1.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({ success: true, user });
    }
    catch (err) {
        console.error("SIGNUP ERROR:", err);
        return res.status(500).json({ success: false });
    }
});
exports.default = router;
