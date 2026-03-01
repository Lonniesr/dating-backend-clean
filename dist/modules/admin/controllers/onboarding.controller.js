"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveBasicInfo = saveBasicInfo;
exports.savePhotos = savePhotos;
exports.savePreferences = savePreferences;
exports.savePersonality = savePersonality;
exports.completeOnboarding = completeOnboarding;
const prisma_1 = __importDefault(require("../../../prisma"));
async function saveBasicInfo(req, res) {
    try {
        const { userId, name, birthdate, gender } = req.body;
        if (!userId || !name || !birthdate || !gender) {
            return res.status(400).json({
                success: false,
                message: "Missing fields.",
            });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                name,
                birthdate: new Date(birthdate),
                gender,
            },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("saveBasicInfo error:", err);
        return res.status(500).json({ success: false });
    }
}
async function savePhotos(req, res) {
    try {
        const { userId, photos } = req.body;
        if (!userId || !Array.isArray(photos)) {
            return res.status(400).json({
                success: false,
                message: "Missing fields.",
            });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { photos },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("savePhotos error:", err);
        return res.status(500).json({ success: false });
    }
}
async function savePreferences(req, res) {
    try {
        const { userId, preferences } = req.body;
        if (!userId || !preferences) {
            return res.status(400).json({
                success: false,
                message: "Missing fields.",
            });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { preferences },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("savePreferences error:", err);
        return res.status(500).json({ success: false });
    }
}
async function savePersonality(req, res) {
    try {
        const { userId, prompts } = req.body;
        if (!userId || !Array.isArray(prompts)) {
            return res.status(400).json({
                success: false,
                message: "Missing fields.",
            });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { prompts },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("savePersonality error:", err);
        return res.status(500).json({ success: false });
    }
}
async function completeOnboarding(req, res) {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Missing userId.",
            });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { onboardingComplete: true },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("completeOnboarding error:", err);
        return res.status(500).json({ success: false });
    }
}
