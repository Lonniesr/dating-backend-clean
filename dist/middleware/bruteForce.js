"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBruteForce = checkBruteForce;
exports.registerFailure = registerFailure;
exports.resetFailures = resetFailures;
const redis_1 = require("redis");
const env_1 = require("../config/env");
const memoryStore = new Map();
let redisClient = null;
let redisHealthy = false;
if (env_1.env.REDIS_URL) {
    redisClient = (0, redis_1.createClient)({ url: env_1.env.REDIS_URL });
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
function config(mode) {
    if (mode === "admin") {
        return { max: 3, lockMs: 30 * 60 * 1000 };
    }
    return { max: 5, lockMs: 15 * 60 * 1000 };
}
function key(mode, identifier) {
    return `bf:${mode}:${identifier}`;
}
async function checkBruteForce(req, identifier, mode) {
    const { max, lockMs } = config(mode);
    const k = key(mode, identifier);
    if (redisHealthy && redisClient) {
        const attempts = Number(await redisClient.get(k) || 0);
        if (attempts >= max)
            throw new Error("Account temporarily locked");
        return;
    }
    const record = memoryStore.get(k);
    if (record && record.count >= max && record.expires > Date.now()) {
        throw new Error("Account temporarily locked");
    }
}
async function registerFailure(identifier, mode) {
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
    }
    else {
        record.count += 1;
    }
}
async function resetFailures(identifier, mode) {
    const k = key(mode, identifier);
    if (redisHealthy && redisClient) {
        await redisClient.del(k);
        return;
    }
    memoryStore.delete(k);
}
