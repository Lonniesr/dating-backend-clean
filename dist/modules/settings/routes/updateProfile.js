"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.put("/", requireUser_1.requireUser, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { name, bio } = req.body;
        const updated = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: { name, bio },
        });
        return res.json({ success: true, user: updated });
    }
    catch (err) {
        console.error("UPDATE PROFILE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
