"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
const crypto_1 = require("crypto");
/**
 * Attaches a unique requestId to every incoming request.
 * Useful for correlating logs, debugging, and tracing.
 */
function requestId(req, _res, next) {
    const id = (0, crypto_1.randomUUID)();
    // Attach to request object
    req.requestId = id;
    // Also attach to headers for downstream services
    req.headers["x-request-id"] = id;
    next();
}
