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
 * GET
 * /api/admin/verification
 *
 * Returns users waiting for verification
 */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            where: {
                verification_status: "pending",
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                verification_selfie: true,
                verification_status: true,
                verified: true,
            },
        });
        res.json({ users });
    }
    catch (err) {
        console.error("ADMIN VERIFICATION ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * APPROVE
 * /api/admin/verification/:userId/approve
 */
router.post("/:userId/approve", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                verified: true,
                verification_status: "verified",
            },
        });
        res.json({
            success: true,
            message: "User verified",
        });
    }
    catch (err) {
        console.error("VERIFY APPROVE ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * REJECT
 * /api/admin/verification/:userId/reject
 */
router.post("/:userId/reject", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                verification_status: "rejected",
                verification_selfie: null,
            },
        });
        res.json({
            success: true,
            message: "Verification rejected",
        });
    }
    catch (err) {
        console.error("VERIFY REJECT ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
