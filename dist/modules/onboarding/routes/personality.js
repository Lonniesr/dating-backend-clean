"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const prisma_1 = __importDefault(require("../../../prisma")); // FIXED
const router = (0, express_1.Router)();
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompts } = req.body;
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: { prompts },
        });
        return res.json({
            user: updated,
        });
    }
    catch (err) {
        console.error("ONBOARDING /personality ERROR:", err);
        return res.status(500).json({ error: "Failed to update personality prompts" });
    }
});
exports.default = router;
