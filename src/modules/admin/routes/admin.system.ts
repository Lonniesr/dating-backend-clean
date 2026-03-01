import { Router } from "express";
import os from "os";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";
import { createClient } from "redis";
import packageJson from "../../../../package.json";

const router = Router();

/**
 * GET /api/admin/system/health
 */
router.get("/health", requireAdmin, async (_req, res) => {
  const start = Date.now();

  let api = "OK";
  let db = "OK";
  let redis = "DISABLED";

  // -------------------------
  // Database Check
  // -------------------------
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "ERROR";
  }

  // -------------------------
  // Redis Check (optional)
  // -------------------------
  if (process.env.REDIS_URL) {
    try {
      const client = createClient({ url: process.env.REDIS_URL });
      await client.connect();
      await client.ping();
      await client.disconnect();
      redis = "OK";
    } catch {
      redis = "ERROR";
    }
  }

  // -------------------------
  // System Metrics
  // -------------------------
  const latency = Date.now() - start;

  const memoryUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const cpuLoad = os.loadavg()[0]; // 1-minute average

  res.json({
    api,
    db,
    redis,
    latency,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: packageJson.version,
    memory: {
      usedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      totalMB: (totalMem / 1024 / 1024).toFixed(0),
      freeMB: (freeMem / 1024 / 1024).toFixed(0),
    },
    cpuLoad: cpuLoad.toFixed(2),
  });
});

export default router;