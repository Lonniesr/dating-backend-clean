"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma")); // FIXED
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: { onboardingComplete: true },
        });
        return res.json({
            user: updated,
        });
    }
    catch (err) {
        console.error("ONBOARDING /complete ERROR:", err);
        return res.status(500).json({ error: "Failed to complete onboarding" });
    }
});
exports.default = router;
