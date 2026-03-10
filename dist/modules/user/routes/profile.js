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
 * GET /api/profile
 */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ error: "Profile not found" });
        }
        const photos = await prisma_1.default.photo.findMany({
            where: { userId },
            orderBy: { order: "asc" },
            select: { url: true },
        });
        const safeProfile = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            username: user.username,
            birthdate: user.birthdate,
            age: user.age,
            gender: user.gender,
            race: user.race,
            bio: user.bio,
            birthplace: user.birthplace,
            location: user.location,
            latitude: user.latitude,
            longitude: user.longitude,
            photos: photos.map((p) => p.url),
            prompts: user.prompts || {},
            preferences: user.preferences || {},
            verified: user.verified,
            verification_status: user.verification_status,
            onboardingComplete: user.onboardingComplete,
            lastActiveAt: user.lastActiveAt,
        };
        return res.json(safeProfile);
    }
    catch (err) {
        console.error("PROFILE FETCH ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/**
 * POST /api/profile/location
 */
router.post("/location", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { latitude, longitude } = req.body;
        const lat = Number(latitude);
        const lon = Number(longitude);
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return res.status(400).json({
                error: "Invalid latitude or longitude",
            });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                latitude: lat,
                longitude: lon,
            },
            select: {
                latitude: true,
                longitude: true,
            },
        });
        return res.json({
            success: true,
            location: updatedUser,
        });
    }
    catch (err) {
        console.error("LOCATION SAVE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
