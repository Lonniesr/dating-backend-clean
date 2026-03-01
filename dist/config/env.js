"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(name) {
    const v = process.env[name];
    if (!v || !v.trim()) {
        throw new Error(`❌ Missing required env var: ${name}`);
    }
    return v;
}
function optional(name) {
    const v = process.env[name];
    return v && v.trim() ? v : undefined;
}
exports.env = {
    NODE_ENV: (process.env.NODE_ENV || "development"),
    PORT: Number(process.env.PORT || 10000),
    JWT_SECRET: required("JWT_SECRET"),
    ADMIN_EMAIL: optional("ADMIN_EMAIL"),
    ADMIN_PASSWORD: optional("ADMIN_PASSWORD"),
    CORS_ORIGIN: optional("CORS_ORIGIN"),
    ADMIN_CORS_ORIGIN: optional("ADMIN_CORS_ORIGIN"),
    REDIS_URL: optional("REDIS_URL"),
    // ✅ ADD THIS
    FRONTEND_URL: optional("FRONTEND_URL"),
};
