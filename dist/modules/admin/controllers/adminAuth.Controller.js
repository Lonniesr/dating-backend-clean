"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminLogin = (req, res) => {
    const { email, password } = req.body;
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.error("Admin credentials not set in environment variables");
        return res.status(500).json({ error: "Server configuration error" });
    }
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not set");
        return res.status(500).json({ error: "Server configuration error" });
    }
    const token = jsonwebtoken_1.default.sign({
        id: "admin",
        role: "admin",
        email,
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
};
exports.adminLogin = adminLogin;
