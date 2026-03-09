"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // Safety validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Missing password fields" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user || !user.password) {
            return res.status(404).json({ error: "User not found" });
        }
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: "Incorrect password" });
        }
        const hashed = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { password: hashed },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
