"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../prisma"));
const env_1 = require("../../../config/env");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    var _a;
    console.log("🔥🔥 ADMIN LOGIN ROUTE HIT 🔥🔥");
    console.log("Admin raw body:", req.body);
    try {
        const { email, password } = req.body;
        console.log("Admin email:", email);
        console.log("Admin password:", password);
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        if (!env_1.env.JWT_SECRET) {
            return res.status(500).json({ error: "JWT_SECRET not configured" });
        }
        const admin = await prisma_1.default.admin.findUnique({
            where: { email },
            select: { id: true, email: true, password: true, userId: true },
        });
        console.log("Admin found:", admin === null || admin === void 0 ? void 0 : admin.email);
        console.log("Stored admin hash:", admin === null || admin === void 0 ? void 0 : admin.password);
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const ok = await bcryptjs_1.default.compare(password, admin.password);
        console.log("Admin password match:", ok);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: admin.id,
            role: "admin",
            email: admin.email,
            userId: (_a = admin.userId) !== null && _a !== void 0 ? _a : null,
        }, env_1.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: env_1.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });
        return res.json({ ok: true, admin: { id: admin.id, email: admin.email } });
    }
    catch (err) {
        console.error("Admin login error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
