"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const os_1 = __importDefault(require("os"));
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const redis_1 = require("redis");
const package_json_1 = __importDefault(require("../../../../package.json"));
const router = (0, express_1.Router)();
/**
 * GET /api/admin/system/health
 */
router.get("/health", requireAdmin_1.requireAdmin, async (_req, res) => {
    const start = Date.now();
    let api = "OK";
    let db = "OK";
    let redis = "DISABLED";
    // -------------------------
    // Database Check
    // -------------------------
    try {
        await prisma_1.default.$queryRaw `SELECT 1`;
    }
    catch {
        db = "ERROR";
    }
    // -------------------------
    // Redis Check (optional)
    // -------------------------
    if (process.env.REDIS_URL) {
        try {
            const client = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
            await client.connect();
            await client.ping();
            await client.disconnect();
            redis = "OK";
        }
        catch {
            redis = "ERROR";
        }
    }
    // -------------------------
    // System Metrics
    // -------------------------
    const latency = Date.now() - start;
    const memoryUsage = process.memoryUsage();
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const cpuLoad = os_1.default.loadavg()[0]; // 1-minute average
    res.json({
        api,
        db,
        redis,
        latency,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: package_json_1.default.version,
        memory: {
            usedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
            totalMB: (totalMem / 1024 / 1024).toFixed(0),
            freeMB: (freeMem / 1024 / 1024).toFixed(0),
        },
        cpuLoad: cpuLoad.toFixed(2),
    });
});
exports.default = router;
