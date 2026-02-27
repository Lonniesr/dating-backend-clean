"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSocket = adminSocket;
const socketAuth_1 = require("../middleware/socketAuth");
const socketRole_1 = require("../middleware/socketRole");
function adminSocket(io) {
    const nsp = io.of("/admin");
    // 🔐 Centralized middleware
    nsp.use((0, socketAuth_1.socketAuth)());
    nsp.use((0, socketRole_1.requireSocketRole)("ADMIN"));
    nsp.on("connection", (socket) => {
        const adminId = socket.data.userId;
        if (!adminId) {
            socket.disconnect();
            return;
        }
        console.log("🛡️ Admin connected:", socket.id, "admin:", adminId);
        socket.join("admins");
        // ================================
        // ADMIN ONLINE
        // ================================
        nsp.emit("admin:online", { adminId });
        // ================================
        // GLOBAL ALERT
        // ================================
        socket.on("admin:alert", (alert) => {
            if (typeof alert !== "object" ||
                alert === null ||
                !("type" in alert) ||
                !("message" in alert)) {
                return;
            }
            const { type, message } = alert;
            if (typeof type !== "string" ||
                typeof message !== "string" ||
                message.length > 2000) {
                return;
            }
            nsp.to("admins").emit("admin:alert", {
                adminId,
                type,
                message,
                timestamp: Date.now(),
            });
        });
        // ================================
        // TIMELINE EVENT
        // ================================
        socket.on("admin:timeline", (event) => {
            if (typeof event !== "object" ||
                event === null ||
                !("event" in event)) {
                return;
            }
            const { event: eventName, data } = event;
            if (typeof eventName !== "string")
                return;
            nsp.to("admins").emit("admin:timeline", {
                adminId,
                event: eventName,
                data: data !== null && data !== void 0 ? data : null,
                timestamp: Date.now(),
            });
        });
        // ================================
        // SESSION UPDATE
        // ================================
        socket.on("admin:session", (session) => {
            nsp.to("admins").emit("admin:session", {
                adminId,
                session,
                timestamp: Date.now(),
            });
        });
        // ================================
        // DISCONNECT (Redis-safe)
        // ================================
        socket.on("disconnect", async () => {
            console.log("🛡️ Admin disconnected:", socket.id, "admin:", adminId);
            const sockets = await nsp.in("admins").fetchSockets();
            const stillOnline = sockets.some((s) => s.data.userId === adminId);
            if (!stillOnline) {
                nsp.emit("admin:offline", { adminId });
            }
        });
    });
}
