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
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { photos } = req.body;
        if (!Array.isArray(photos)) {
            return res.status(400).json({ error: "Photos must be an array" });
        }
        if (photos.length === 0) {
            return res.status(400).json({ error: "At least one photo is required" });
        }
        if (photos.length > 6) {
            return res.status(400).json({ error: "Maximum of 6 photos allowed" });
        }
        const cleanedPhotos = photos
            .map((p) => (typeof p === "string" ? p.trim() : ""))
            .filter((url) => url.length > 0);
        const validPhotos = cleanedPhotos.every((url) => url.startsWith("http"));
        if (!validPhotos) {
            return res.status(400).json({ error: "All photos must be valid URLs" });
        }
        await prisma_1.default.photo.deleteMany({ where: { userId } });
        await prisma_1.default.photo.createMany({
            data: cleanedPhotos.map((url, index) => ({
                userId,
                url,
                order: index,
            })),
        });
        const updatedUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                photos: {
                    orderBy: { order: "asc" },
                },
            },
        });
        return res.json({
            success: true,
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("ONBOARDING /photos ERROR:", err);
        return res.status(500).json({
            error: "Failed to update photos",
        });
    }
});
exports.default = router;
