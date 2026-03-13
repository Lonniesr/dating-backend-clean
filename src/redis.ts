import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on("error", (err) => {
  console.error("Redis Client Error", err);
});

(async () => {
  try {
    await redis.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
})();

export default redis;