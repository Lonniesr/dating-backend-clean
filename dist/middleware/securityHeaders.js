"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = securityHeaders;
const helmet_1 = __importDefault(require("helmet"));
/**
 * Apply Helmet security headers.
 * Exported as a NAMED function (not default).
 */
function securityHeaders(req, res, next) {
    return (0, helmet_1.default)()(req, res, next);
}
