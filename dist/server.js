"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.activeChats = exports.onlineUsers = void 0;
console.log("🚨 THIS IS THE ACTIVE SERVER FILE 🚨");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const hpp_1 = __importDefault(require("hpp"));
const socket_io_1 = require("socket.io");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.onlineUsers = new Set();
exports.activeChats = new Map();
/* =========================
   🔥 PUBLIC FILES (CRITICAL FIX)
========================= */
app.use("/uploads", express_1.default.static("uploads", {
    fallthrough: false,
    maxAge: "7d",
}));
app.set("trust proxy", 1);
/* =========================
   SECURITY + MIDDLEWARE
========================= */
app.use((0, helmet_1.default)({
    contentSecurityPolicy: env_1.env.NODE_ENV === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use((0, compression_1.default)());
app.use((0, hpp_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
/* =========================
   APP LOGIC
========================= */
app.use("/api", routes_1.default);
app.get("/", (_req, res) => {
    res.send("Dating backend is alive 🚀");
});
app.use((err, _req, res, _next) => {
    console.error("🔥 Global error:", err);
    res.status((err === null || err === void 0 ? void 0 : err.status) || 500).json({
        message: env_1.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err === null || err === void 0 ? void 0 : err.message,
    });
});
/* =========================
   SOCKET.IO
========================= */
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
});
/* 🔥 REQUIRED FOR SOCKET ACCESS IN ROUTES */
app.set("io", exports.io);
exports.io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);
    socket.on("chat:join", (userId) => {
        socket.data.userId = userId;
        socket.join(`user:${userId}`);
        // 🟢 MARK ONLINE
        exports.onlineUsers.add(userId);
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
            exports.activeChats.set(userId, otherUserId);
            console.log("💬 ACTIVE CHAT:", userId, "→", otherUserId);
            console.log("👥 JOINED CONVERSATION ROOM:", room);
        }
        catch (err) {
            console.error("❌ conversation:join error:", err);
        }
    });
    /* =========================
      🔥 TYPING EVENTS
   ========================= */
    socket.on("typing:start", ({ to }) => {
        try {
            const fromUserId = socket.data.userId;
            if (!fromUserId || !to)
                return;
            const room = `conversation:${[fromUserId, to]
                .sort()
                .join(":")}`;
            exports.io.to(room).emit("typing:start", {
                fromUserId,
            });
        }
        catch (err) {
            console.error("❌ typing:start error:", err);
        }
    });
    socket.on("typing:stop", ({ to }) => {
        try {
            const fromUserId = socket.data.userId;
            if (!fromUserId || !to)
                return;
            const room = `conversation:${[fromUserId, to]
                .sort()
                .join(":")}`;
            exports.io.to(room).emit("typing:stop", {
                fromUserId,
            });
        }
        catch (err) {
            console.error("❌ typing:stop error:", err);
        }
    });
    /* =========================
       🔥 MESSAGE REACTIONS
    ========================= */
    socket.on("message:reaction", async ({ messageId, emoji, otherUserId, }) => {
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
            exports.io.to(room).emit("message:reaction:update", {
                messageId,
                emoji,
            });
            console.log("✅ REACTION BROADCAST", room);
        }
        catch (err) {
            console.error("❌ REACTION ERROR:", err);
        }
    });
    socket.on("disconnect", () => {
        const userId = socket.data.userId;
        if (userId) {
            exports.onlineUsers.delete(userId);
            const activeChatUserId = socket.data.activeChatUserId;
            if (activeChatUserId) {
                exports.activeChats.delete(userId);
                console.log("🧹 ACTIVE CHAT CLEARED:", userId);
            }
            console.log("⚫ User OFFLINE:", userId);
        }
        console.log("❌ Socket disconnected:", socket.id);
    });
});
/* =========================
   START SERVER
========================= */
const PORT = env_1.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
