"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const requireUser_1 = require("./requireUser");
async function requireAdmin(req, res, next) {
    await (0, requireUser_1.requireUser)(req, res, async () => {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    });
}
