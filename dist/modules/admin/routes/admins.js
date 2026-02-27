"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
/**
 * GET /admins
 */
router.get("/", async (_req, res) => {
    try {
        const admins = await prisma_1.default.admin.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                User: true, // ⚠️ Prisma relations are case-sensitive
            },
        });
        return res.json({ success: true, admins });
    }
    catch (err) {
        console.error("GET /admins error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
/**
 * POST /admins
 */
router.post("/", async (req, res) => {
    try {
        const { email, password, userId } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required",
            });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const admin = await prisma_1.default.admin.create({
            data: {
                email,
                password: hashed,
                userId: userId !== null && userId !== void 0 ? userId : null,
            },
        });
        return res.json({ success: true, admin });
    }
    catch (err) {
        console.error("POST /admins error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
/**
 * DELETE /admins/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;
        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Missing id",
            });
        }
        await prisma_1.default.admin.delete({
            where: { id },
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("DELETE /admins error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
        });
    }
});
exports.default = router;
