"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = logger;
/**
 * Logs method, path, status, duration, and requestId.
 */
function logger(req, res, next) {
    const start = Date.now();
    const requestId = req.requestId;
    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
}
