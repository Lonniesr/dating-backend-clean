"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { photos } = req.body;
        // Validate input
        if (!Array.isArray(photos)) {
            return res.status(400).json({ error: "Photos must be an array" });
        }
        if (photos.length === 0) {
            return res.status(400).json({ error: "At least one photo is required" });
        }
        // Optional: ensure all items are strings
        const allStrings = photos.every((p) => typeof p === "string");
        if (!allStrings) {
            return res.status(400).json({ error: "All photos must be string URLs" });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                photos: {
                    set: photos, // safer for array fields
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
                gender: true,
                photos: true,
                onboardingComplete: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.json({
            success: true,
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("ONBOARDING /photos ERROR:", err);
        return res.status(500).json({ error: "Failed to update photos" });
    }
});
exports.default = router;
