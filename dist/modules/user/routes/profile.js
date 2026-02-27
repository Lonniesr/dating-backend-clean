"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
// GET /api/profile
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        // ✅ Type guard (fixes "possibly undefined")
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const profile = await prisma_1.default.user.findUnique({
            where: { id: req.user.id }, // ✅ fixed
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                birthdate: true,
                gender: true,
                photos: true,
                preferences: true,
                prompts: true,
                onboardingComplete: true,
            },
        });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        return res.json(profile);
    }
    catch (err) {
        console.error("PROFILE FETCH ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
