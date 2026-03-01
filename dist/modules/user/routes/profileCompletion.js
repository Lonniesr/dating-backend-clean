"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const personalityComplete = Array.isArray(user.prompts) && user.prompts.length > 0;
        const photosComplete = Array.isArray(user.photos) && user.photos.length >= 1;
        const checks = {
            name: !!user.name,
            gender: !!user.gender,
            preferences: !!user.preferences,
            personality: personalityComplete,
            photos: photosComplete
        };
        const total = Object.keys(checks).length;
        const completed = Object.values(checks).filter(Boolean).length;
        const percent = Math.round((completed / total) * 100);
        return res.json({
            percent,
            checks
        });
    }
    catch (err) {
        console.error("PROFILE COMPLETION ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
