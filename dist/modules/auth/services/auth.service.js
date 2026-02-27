"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../../prisma"));
async function getCurrentUser(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.split(" ")[1];
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
        });
        return user;
    }
    catch {
        return null;
    }
}
async function requireAdmin(req) {
    const user = await getCurrentUser(req);
    if (!user) {
        return { ok: false, status: 401, error: "Not authenticated" };
    }
    if (user.role !== "superadmin") {
        return { ok: false, status: 403, error: "Forbidden" };
    }
    return { ok: true, user };
}
