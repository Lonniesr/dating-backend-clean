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
 * POST /api/onboarding/complete
 * Marks onboarding as finished
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                onboardingComplete: true,
            },
            select: {
                id: true,
                onboardingComplete: true,
            },
        });
        return res.json({
            success: true,
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("ONBOARDING /complete ERROR:", err);
        return res.status(500).json({
            error: "Failed to complete onboarding",
        });
    }
});
exports.default = router;
