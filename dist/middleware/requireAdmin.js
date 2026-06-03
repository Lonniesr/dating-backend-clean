"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const requireUser_1 = require("./requireUser");
async function requireAdmin(req, res, next) {
    try {
        await (0, requireUser_1.requireUser)(req, res, () => {
            // If requireUser already sent a response, stop here
            if (res.headersSent)
                return;
            if (!req.user || req.user.role !== "admin") {
                return res.status(403).json({
                    message: "Forbidden",
                });
            }
            return next();
        });
    }
    catch (err) {
        console.error("requireAdmin error:", err);
        if (!res.headersSent) {
            return res.status(500).json({
                message: "Internal Server Error",
            });
        }
    }
}
