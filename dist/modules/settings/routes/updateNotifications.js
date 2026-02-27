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
    var _a;
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { push, email } = req.body;
        const updated = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                preferences: {
                    ...((_a = req.user.preferences) !== null && _a !== void 0 ? _a : {}),
                    notifications: { push, email },
                },
            },
        });
        return res.json({ success: true, user: updated });
    }
    catch (err) {
        console.error("UPDATE NOTIFICATIONS ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
