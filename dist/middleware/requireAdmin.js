"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const env_1 = require("../config/env");
async function requireAdmin(req, res, next) {
    var _a;
    try {
        // 🔐 Read token from httpOnly cookie
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        // Extract user id from JWT
        const userId = typeof payload.sub === "string" ? payload.sub : payload.id;
        if (!userId) {
            return res.status(401).json({ error: "Invalid token payload" });
        }
        // 🔎 Database is source of truth
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        if (!user || user.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }
        // Attach admin user to request
        req.admin = user;
        next();
    }
    catch (err) {
        console.error("ADMIN AUTH ERROR:", err);
        return res.status(500).json({ error: "Authentication failed" });
    }
}
