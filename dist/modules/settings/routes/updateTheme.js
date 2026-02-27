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
 * Update user theme preference
 * Example body: { theme: "dark" }
 */
router.put("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { theme } = req.body;
        if (!theme) {
            return res.status(400).json({ error: "Theme is required" });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { theme },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("UPDATE THEME ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
