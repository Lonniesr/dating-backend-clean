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
 * GET /api/admin/roles
 */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        const roles = await prisma_1.default.user.groupBy({
            by: ["role"],
            _count: { role: true },
        });
        res.json({ roles });
    }
    catch (err) {
        console.error("ADMIN ROLES ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * GET /api/admin/roles/users?role=admin
 */
router.get("/users", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const role = req.query.role;
        const users = await prisma_1.default.user.findMany({
            where: { role },
            orderBy: { createdAt: "desc" },
        });
        res.json({ users });
    }
    catch (err) {
        console.error("ADMIN ROLE USERS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
/**
 * POST /api/admin/roles/assign
 */
router.post("/assign", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const { userId, role } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { role },
        });
        res.json({ user });
    }
    catch (err) {
        console.error("ADMIN ROLE ASSIGN ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
