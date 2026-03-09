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
 * PUT /api/settings/notifications
 * Updates notification preferences
 */
router.put("/", requireUser_1.requireUser, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { messageNotifications, matchNotifications, marketingNotifications, } = req.body;
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { preferences: true },
        });
        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }
        const existingPreferences = currentUser.preferences &&
            typeof currentUser.preferences === "object"
            ? currentUser.preferences
            : {};
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                preferences: {
                    ...existingPreferences,
                    messageNotifications,
                    matchNotifications,
                    marketingNotifications,
                },
            },
            select: {
                id: true,
                preferences: true,
            },
        });
        return res.json({
            success: true,
            preferences: updatedUser.preferences,
        });
    }
    catch (err) {
        console.error("UPDATE NOTIFICATIONS ERROR:", err);
        return res.status(500).json({
            error: "Server error",
        });
    }
});
exports.default = router;
