"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfTokenSetter = csrfTokenSetter;
exports.csrfProtection = csrfProtection;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "x-csrf-token";
function csrfTokenSetter(req, res, next) {
    if (!req.cookies[CSRF_COOKIE]) {
        const token = crypto_1.default.randomBytes(32).toString("hex");
        res.cookie(CSRF_COOKIE, token, {
            httpOnly: false,
            secure: env_1.env.NODE_ENV === "production",
            sameSite: env_1.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        });
    }
    next();
}
function csrfProtection(req, res, next) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return next();
    }
    const cookieToken = req.cookies[CSRF_COOKIE];
    const headerToken = req.headers[CSRF_HEADER];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: "Invalid CSRF token" });
    }
    next();
}
