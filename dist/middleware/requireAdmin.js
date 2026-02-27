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
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
        if (payload.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const adminId = typeof payload.sub === "string" ? payload.sub : payload.id;
        if (!adminId) {
            return res.status(401).json({ error: "Invalid token payload" });
        }
        const admin = await prisma_1.default.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin) {
            return res.status(401).json({ error: "Admin not found" });
        }
        // Attach admin to request for downstream use
        req.admin = admin;
        next();
    }
    catch (err) {
        console.error("ADMIN AUTH ERROR:", err);
        return res.status(500).json({ error: "Authentication failed" });
    }
}
