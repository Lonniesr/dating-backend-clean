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
const bruteForce_1 = require("../../../middleware/bruteForce");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Invalid credentials" });
        }
        await (0, bruteForce_1.checkBruteForce)(req, email, "user");
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user || user.banned) {
            await (0, bruteForce_1.registerFailure)(email, "user");
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            await (0, bruteForce_1.registerFailure)(email, "user");
            return res.status(401).json({ error: "Invalid credentials" });
        }
        await (0, bruteForce_1.resetFailures)(email, "user");
        // 🔐 CLEAN JWT (database is source of truth)
        const token = jsonwebtoken_1.default.sign({ sub: user.id }, env_1.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: env_1.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/",
        });
        return res.json({ ok: true });
    }
    catch {
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
