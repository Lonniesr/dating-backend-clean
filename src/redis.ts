import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true
  }
});

redis.on("error", (err) => {
  console.error("Redis Client Error", err);
});

(async () => {
  try {
    await redis.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.log("Redis unavailable (local dev)");
  }
})();

export default redis;