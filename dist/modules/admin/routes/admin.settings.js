"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/settings
 */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        let settings = await prisma_1.default.adminSettings.findUnique({
            where: { id: "admin-settings" },
        });
        // If not created yet, create default row
        if (!settings) {
            settings = await prisma_1.default.adminSettings.create({
                data: { id: "admin-settings" },
            });
        }
        res.json({ settings });
    }
    catch (err) {
        console.error("ADMIN SETTINGS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * POST /api/admin/settings
 */
router.post("/", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const { maintenanceMode, siteName, supportEmail } = req.body;
        const updated = await prisma_1.default.adminSettings.upsert({
            where: { id: "admin-settings" },
            update: {
                maintenanceMode,
                siteName,
                supportEmail,
            },
            create: {
                id: "admin-settings",
                maintenanceMode,
                siteName,
                supportEmail,
            },
        });
        res.json({ settings: updated });
    }
    catch (err) {
        console.error("ADMIN SETTINGS UPDATE ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
