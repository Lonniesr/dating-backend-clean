"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: "Email already in use" });
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: { email, password: hash },
            select: {
                id: true,
                email: true,
                role: true,
                onboardingComplete: true,
                createdAt: true,
            },
        });
        // Optional: auto-login on register (if you want)
        // If you don't want register to issue a cookie, remove this block.
        // const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({ user });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
