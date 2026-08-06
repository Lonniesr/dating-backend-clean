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
export const onlineUsers = new Set<string>();
export const activeChats = new Map<string, string>();
/* =========================
   🔥 PUBLIC FILES (CRITICAL FIX)
========================= */

app.use(
  "/uploads",
  express.static("uploads", {
    fallthrough: false,
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
  socket.data.userId = userId;

  socket.join(`user:${userId}`);



  // 🟢 MARK ONLINE
  onlineUsers.add(userId);

  console.log("🟢 User ONLINE:", userId);
}); 
/* =========================
   🔥 CONVERSATION JOIN (CRITICAL FIX)
========================= */

socket.on("conversation:join", ({ otherUserId }) => {
  try {
    const userId = socket.data.userId; // ✅ THIS IS THE KEY

    if (!userId || !otherUserId) {
      console.log("❌ BAD conversation:join payload");
      return;
    }

    const room = `conversation:${[userId, otherUserId].sort().join(":")}`;

    socket.join(room);
    socket.data.activeChatUserId = otherUserId;

    activeChats.set(userId, otherUserId);

    console.log("💬 ACTIVE CHAT:",
  userId,
  "→",
  otherUserId
  
);
    console.log("👥 JOINED CONVERSATION ROOM:", room);
  } catch (err) {
    console.error("❌ conversation:join error:", err);
  }
});

 /* =========================
   🔥 TYPING EVENTS
========================= */

socket.on("typing:start", ({ to }) => {
  try {
    const fromUserId = socket.data.userId;

    if (!fromUserId || !to) return;

    const room = `conversation:${[fromUserId, to]
      .sort()
      .join(":")}`;

    io.to(room).emit("typing:start", {
      fromUserId,
    });

  } catch (err) {
    console.error("❌ typing:start error:", err);
  }
});

socket.on("typing:stop", ({ to }) => {
  try {
    const fromUserId = socket.data.userId;

    if (!fromUserId || !to) return;

    const room = `conversation:${[fromUserId, to]
      .sort()
      .join(":")}`;

    io.to(room).emit("typing:stop", {
      fromUserId,
    });

  } catch (err) {
    console.error("❌ typing:stop error:", err);
  }
});
/* =========================
   🔥 MESSAGE REACTIONS
========================= */

socket.on(
  "message:reaction",
  async ({
    messageId,
    emoji,
    otherUserId,
  }) => {
    console.log("🔥 REACTION RECEIVED", {
      messageId,
      emoji,
      otherUserId,
    });

    if (!messageId || !emoji || !otherUserId) {
      return;
    }

    try {
      const room = `conversation:${[
        socket.data.userId,
        otherUserId,
      ]
        .sort()
        .join(":")}`;

      io.to(room).emit(
        "message:reaction:update",
        {
          messageId,
          emoji,
        }
      );

      console.log(
        "✅ REACTION BROADCAST",
        room
      );
    } catch (err) {
      console.error(
        "❌ REACTION ERROR:",
        err
      );
    }
  }
);
socket.on("disconnect", () => {
  const userId = socket.data.userId;

  if (userId) {
    onlineUsers.delete(userId);
    const activeChatUserId = socket.data.activeChatUserId;

  if (activeChatUserId) {
  activeChats.delete(userId);

  console.log(
    "🧹 ACTIVE CHAT CLEARED:",
    userId
  );
}
    console.log("⚫ User OFFLINE:", userId);
  }

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