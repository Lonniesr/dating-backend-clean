console.log("🚨 THIS IS THE ACTIVE SERVER FILE 🚨");

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { Server as SocketIOServer } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import cookieParser from "cookie-parser";

import apiRoutes from "./routes";
import { registerSockets } from "./sockets";
import { env } from "./config/env";
import { updateLastActive } from "./middleware/updateLastActive";

/* =========================
   APP + SERVER
========================= */

const app = express();
const server = http.createServer(app);

/* =========================
   TRUST PROXY (Render / Nginx)
========================= */

app.set("trust proxy", 1);

/* =========================
   SECURITY MIDDLEWARE
========================= */

app.use(
  helmet({
    contentSecurityPolicy:
      env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());
app.use(hpp());
app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES (🔥 FIX ADDED)
========================= */

// ✅ THIS IS THE FIX — allows images to load
app.use("/uploads", express.static("uploads"));

/* =========================
   CORS (FIXED FOR VERCEL)
========================= */

const allowedOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }

      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      const allowed = allowedOrigins.some((o) =>
        origin.startsWith(o)
      );

      if (allowed) {
        return callback(null, true);
      }

      console.error("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* =========================
   GLOBAL RATE LIMITER
========================= */

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", globalLimiter);

/* =========================
   AUTH RATE LIMITS
========================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

app.use("/api/auth", authLimiter);
app.use("/api/auth/login", loginLimiter);

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    env: env.NODE_ENV,
  });
});

/* =========================
   USER ACTIVITY TRACKING
========================= */

app.use(updateLastActive);

/* =========================
   ROUTES
========================= */

app.use("/api", apiRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("Dating backend is alive 🚀");
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("🔥 Global error:", err);

  res.status(err?.status || 500).json({
    message:
      env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err?.message,
  });
});

/* =========================
   SOCKET.IO
========================= */

export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.endsWith(".vercel.app") ||
        allowedOrigins.some((o) => origin.startsWith(o))
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

/* =========================
   REDIS (OPTIONAL)
========================= */

async function setupRedis() {
  if (!env.REDIS_URL) {
    console.log("⚠️ Redis disabled (no REDIS_URL provided)");
    return;
  }

  try {
    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (e) => console.error("Redis Pub Error:", e));
    subClient.on("error", (e) => console.error("Redis Sub Error:", e));

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log("🚀 Redis adapter connected");
  } catch (e) {
    console.error("❌ Redis connection failed. Continuing without Redis.", e);
  }
}

/* =========================
   START SERVER
========================= */

async function start() {
  try {
    await setupRedis();
    registerSockets(io);

    const PORT = env.PORT || 10000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();

/* =========================
   GRACEFUL SHUTDOWN
========================= */

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});