import { createClient } from "redis";

let redis: any = null;

if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
  redis = createClient({
    url: process.env.REDIS_URL
  });

  redis.on("error", (err: any) => {
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
}

export default redis;