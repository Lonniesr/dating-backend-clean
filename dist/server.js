"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
console.log("🚨 THIS IS THE ACTIVE SERVER FILE 🚨");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const hpp_1 = __importDefault(require("hpp"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes"));
const sockets_1 = require("./sockets");
const env_1 = require("./config/env");
/* =========================
   APP + SERVER
========================= */
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Required for Render / reverse proxies
app.set("trust proxy", 1);
/* =========================
   SECURITY MIDDLEWARE
========================= */
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use((0, compression_1.default)());
app.use((0, hpp_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
/* =========================
   CORS (HARDENED)
========================= */
const allowedOrigins = (env_1.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow Postman / server-to-server
        if (!origin)
            return callback(null, true);
        // Development → allow localhost
        if (env_1.env.NODE_ENV !== "production") {
            if (origin.startsWith("http://localhost") ||
                origin.startsWith("http://127.0.0.1")) {
                return callback(null, true);
            }
        }
        // Production → strict match only
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.error("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
/* =========================
   RATE LIMITING
========================= */
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
});
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/auth", authLimiter);
app.use("/api/auth/login", loginLimiter);
/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
/* =========================
   ROUTES
========================= */
app.use("/api", routes_1.default);
app.get("/", (_req, res) => {
    res.send("Dating backend is alive 🚀");
});
/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, _req, res, _next) => {
    console.error("Global error:", err);
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
        origin: allowedOrigins.length ? allowedOrigins : true,
        credentials: true,
    },
});
/* =========================
   REDIS (OPTIONAL)
========================= */
async function setupRedis() {
    if (!env_1.env.REDIS_URL) {
        console.log("⚠️ Redis disabled (no REDIS_URL provided)");
        return;
    }
    try {
        const pubClient = (0, redis_1.createClient)({
            url: env_1.env.REDIS_URL,
            socket: { reconnectStrategy: false },
        });
        const subClient = pubClient.duplicate();
        pubClient.on("error", (e) => console.error("Redis Pub Error:", e));
        subClient.on("error", (e) => console.error("Redis Sub Error:", e));
        await pubClient.connect();
        await subClient.connect();
        exports.io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        console.log("🚀 Redis adapter connected");
    }
    catch (e) {
        console.error("❌ Redis connection failed. Continuing without Redis.", e);
    }
}
/* =========================
   START SERVER
========================= */
async function start() {
    try {
        await setupRedis();
        (0, sockets_1.registerSockets)(exports.io);
        server.listen(env_1.env.PORT, () => {
            console.log(`🚀 Server running on port ${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
        });
    }
    catch (err) {
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
