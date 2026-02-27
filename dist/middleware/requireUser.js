"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = requireUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const env_1 = require("../config/env");
function getToken(req) {
    var _a;
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith("Bearer "))
        return authHeader.split(" ")[1];
    if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token)
        return req.cookies.token;
    return undefined;
}
function getUserIdFromPayload(payload) {
    if (typeof payload === "string")
        return undefined;
    // Prefer JWT "sub" if present
    if (typeof payload.sub === "string" && payload.sub)
        return payload.sub;
    // Support legacy payloads like { id: "..." }
    const maybeId = payload.id;
    if (typeof maybeId === "string" && maybeId)
        return maybeId;
    return undefined;
}
async function requireUser(req, res, next) {
    try {
        const token = getToken(req);
        if (!token) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const userId = getUserIdFromPayload(decoded);
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                onboardingComplete: true,
                name: true,
                gender: true,
                preferences: true,
            },
        });
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error("AUTH ERROR:", err);
        res.status(401).json({ error: "Unauthorized" });
    }
}
