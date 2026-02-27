"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.delete("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma_1.default.user.delete({
            where: { id: userId },
        });
        res.clearCookie("token");
        return res.json({ success: true });
    }
    catch (err) {
        console.error("DELETE ACCOUNT ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
