"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /api/admin/system/health
router.get("/system/health", async (req, res) => {
    const prisma = req.prisma;
    try {
        const api = "OK";
        let db = "OK";
        try {
            await prisma.$queryRaw `SELECT 1`;
        }
        catch {
            db = "ERROR";
        }
        const queue = "OK";
        const start = Date.now();
        await prisma.$queryRaw `SELECT 1`;
        const latency = Date.now() - start;
        const uptime = 99.98;
        const errorRate = 0.12;
        return res.json({
            api,
            db,
            queue,
            latency,
            uptime,
            errorRate,
        });
    }
    catch (err) {
        console.error("SYSTEM HEALTH ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
