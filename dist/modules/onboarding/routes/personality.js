"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
/**
 * POST /api/onboarding/personality
 * Saves user bio + personality prompts
 */
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { bio, prompts } = req.body;
        // ----- Validation -----
        if (bio && typeof bio !== "string") {
            return res.status(400).json({
                error: "Bio must be a string",
            });
        }
        if (prompts && typeof prompts !== "object") {
            return res.status(400).json({
                error: "Prompts must be an object",
            });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                bio: bio ? bio.trim() : null,
                prompts: prompts || null,
            },
        });
        return res.json({
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("ONBOARDING /personality ERROR:", err);
        return res.status(500).json({
            error: "Failed to update personality data",
        });
    }
});
exports.default = router;
