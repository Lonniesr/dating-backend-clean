"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
/**
 * Global error handler.
 */
function errorHandler(err, req, res, _next) {
    const requestId = req.requestId;
    console.error(`[${requestId}] ERROR:`, err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        requestId,
    });
}
