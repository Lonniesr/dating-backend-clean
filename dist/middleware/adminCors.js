"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCorsGuard = adminCorsGuard;
const env_1 = require("../config/env");
const allowedAdminOrigins = (env_1.env.ADMIN_CORS_ORIGIN || "")
    .split(",")
    .map(o => o.trim())
    .filter(Boolean);
function adminCorsGuard(req, res, next) {
    const origin = req.headers.origin;
    if (!origin)
        return next();
    if (!allowedAdminOrigins.includes(origin)) {
        return res.status(403).json({ error: "Admin origin not allowed" });
    }
    next();
}
