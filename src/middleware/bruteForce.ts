import { Request } from "express";
import { createClient } from "redis";
import { env } from "../config/env";

type Mode = "user" | "admin";

const memoryStore = new Map<string, { count: number; expires: number }>();

let redisClient: ReturnType<typeof createClient> | null = null;
let redisHealthy = false;

if (env.REDIS_URL) {
  redisClient = createClient({ url: env.REDIS_URL });
  redisClient.connect()
    .then(() => {
      redisHealthy = true;
      console.log("✅ BruteForce Redis connected");
    })
    .catch(() => {
      redisHealthy = false;
      console.warn("⚠️ Redis unavailable. Using memory fallback.");
    });
}

function config(mode: Mode) {
  if (mode === "admin") {
    return { max: 3, lockMs: 30 * 60 * 1000 };
  }
  return { max: 5, lockMs: 15 * 60 * 1000 };
}

function key(mode: Mode, identifier: string) {
  return `bf:${mode}:${identifier}`;
}

export async function checkBruteForce(req: Request, identifier: string, mode: Mode) {
  const { max, lockMs } = config(mode);
  const k = key(mode, identifier);

  if (redisHealthy && redisClient) {
    const attempts = Number(await redisClient.get(k) || 0);
    if (attempts >= max) throw new Error("Account temporarily locked");
    return;
  }

  const record = memoryStore.get(k);
  if (record && record.count >= max && record.expires > Date.now()) {
    throw new Error("Account temporarily locked");
  }
}

export async function registerFailure(identifier: string, mode: Mode) {
  const { lockMs } = config(mode);
  const k = key(mode, identifier);

  if (redisHealthy && redisClient) {
    const attempts = await redisClient.incr(k);
    if (attempts === 1) {
      await redisClient.pexpire(k, lockMs);
    }
    return;
  }

  const now = Date.now();
  const record = memoryStore.get(k);

  if (!record || record.expires < now) {
    memoryStore.set(k, { count: 1, expires: now + lockMs });
  } else {
    record.count += 1;
  }
}

export async function resetFailures(identifier: string, mode: Mode) {
  const k = key(mode, identifier);

  if (redisHealthy && redisClient) {
    await redisClient.del(k);
    return;
  }

  memoryStore.delete(k);
}