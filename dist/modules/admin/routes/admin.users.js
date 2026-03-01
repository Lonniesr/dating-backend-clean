"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const router = (0, express_1.Router)();
/* =========================
   GET /api/admin/users
========================= */
router.get("/", requireAdmin_1.requireAdmin, async (req, res) => {
    var _a;
    try {
        const page = req.query.page ? parseInt(req.query.page, 10) || 1 : 1;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) || 20 : 20;
        const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        let where = {};
        if (search) {
            where = {
                OR: [
                    {
                        email: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                ],
            };
        }
        const users = await prisma_1.default.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                verified: true,
                banned: true,
                createdAt: true,
                lastActiveAt: true,
            },
        });
        const total = await prisma_1.default.user.count({ where });
        return res.json({
            users,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    }
    catch (err) {
        console.error("ADMIN USER LIST ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/* =========================
   GET /api/admin/users/:id
========================= */
router.get("/:id", requireAdmin_1.requireAdmin, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.params.id },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json(user);
    }
    catch (err) {
        console.error("ADMIN USER DETAIL ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
