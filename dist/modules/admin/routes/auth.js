"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../../prisma"));
const sessions_1 = require("../../../utils/sessions");
const server_1 = require("../../../server");
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" });
        }
        const admin = await prisma_1.default.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const valid = await bcryptjs_1.default.compare(password, admin.password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET not configured");
        }
        const token = jsonwebtoken_1.default.sign({ sub: admin.id, role: "admin" }, secret, { expiresIn: "7d" });
        (0, sessions_1.addSession)(admin.id);
        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                createdAt: admin.createdAt,
            },
        });
        process.nextTick(() => {
            server_1.io.of("/analytics").emit("active_sessions", {
                value: (0, sessions_1.getActiveSessionCount)(),
            });
        });
    }
    catch (err) {
        console.error("ADMIN LOGIN ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
