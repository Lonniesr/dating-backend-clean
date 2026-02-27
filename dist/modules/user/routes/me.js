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
 * GET /api/auth/me
 * Returns the authenticated user's full onboarding state
 */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                birthdate: true,
                gender: true,
                photos: true,
                preferences: true,
                prompts: true,
                onboardingComplete: true,
                createdAt: true,
                lastActiveAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json({ working: true, user });
    }
    catch (err) {
        console.error("Error in /me route:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
