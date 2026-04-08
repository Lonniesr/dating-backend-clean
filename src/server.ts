console.log("🚨 THIS IS THE ACTIVE SERVER FILE 🚨");

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";

import apiRoutes from "./routes";
import { env } from "./config/env";
import { updateLastActive } from "./middleware/updateLastActive";

const app = express();
const server = http.createServer(app);

/* =========================
   🔥 PUBLIC FILES (CRITICAL FIX)
========================= */

app.use(
  "/uploads",
  express.static("uploads", {
    fallthrough: false, // 🚨 prevents middleware from running after
    maxAge: "7d",
  })
);

app.set("trust proxy", 1);

/* =========================
   SECURITY + MIDDLEWARE
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

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* =========================
   APP LOGIC
========================= */

app.use(updateLastActive);

app.use("/api", apiRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("Dating backend is alive 🚀");
});

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
    origin: true,
    credentials: true,
  },
});

/* 🔥 REQUIRED FOR SOCKET ACCESS IN ROUTES */
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  socket.on("chat:join", (userId: string) => {
    socket.join(userId);
    console.log("👤 User joined room:", userId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */

const PORT = env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});