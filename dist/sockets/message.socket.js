"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSocket = messageSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const JWT_SECRET = process.env.JWT_SECRET;
function getConversationRoom(userA, userB) {
    return `conversation:${[userA, userB].sort().join(":")}`;
}
function messageSocket(io) {
    const nsp = io.of("/messages");
    // ===============================
    // 🔐 JWT MIDDLEWARE
    // ===============================
    nsp.use((socket, next) => {
        var _a, _b;
        try {
            const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ||
                ((_b = socket.handshake.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
            if (!token)
                return next(new Error("Unauthorized"));
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    // ===============================
    // CONNECTION
    // ===============================
    nsp.on("connection", (socket) => {
        const userId = socket.userId;
        console.log("💬 Messages connected:", userId);
        // Join personal room (critical for scaling)
        socket.join(`user:${userId}`);
        // ===============================
        // JOIN CONVERSATION ROOM
        // ===============================
        socket.on("conversation:join", ({ otherUserId }) => {
            if (!otherUserId)
                return;
            const room = getConversationRoom(userId, otherUserId);
            socket.join(room);
        });
        // ===============================
        // SEND MESSAGE
        // ===============================
        socket.on("message:send", async (payload) => {
            try {
                const { receiverId, text, imageUrl, audioUrl, reaction } = payload;
                if (!receiverId)
                    return;
                if (!text && !imageUrl && !audioUrl && !reaction)
                    return;
                const message = await prisma_1.default.message.create({
                    data: {
                        senderId: userId,
                        receiverId,
                        text,
                        imageUrl,
                        audioUrl,
                        reaction,
                        delivered: false,
                        read: false,
                    },
                });
                const conversationRoom = getConversationRoom(userId, receiverId);
                // Deliver to receiver
                nsp.to(`user:${receiverId}`).emit("message:new", message);
                // Confirm to sender
                socket.emit("message:sent", message);
                // Emit to shared room if open
                nsp.to(conversationRoom).emit("conversation:message", message);
            }
            catch (err) {
                console.error("MESSAGE SOCKET ERROR:", err);
                socket.emit("message:error", {
                    message: "Failed to send message",
                });
            }
        });
        // ===============================
        // MARK AS READ
        // ===============================
        socket.on("message:read", async ({ otherUserId }) => {
            try {
                if (!otherUserId)
                    return;
                await prisma_1.default.message.updateMany({
                    where: {
                        senderId: otherUserId,
                        receiverId: userId,
                        read: false,
                    },
                    data: { read: true },
                });
                const conversationRoom = getConversationRoom(userId, otherUserId);
                // Notify both users in conversation
                nsp.to(conversationRoom).emit("message:read:update", {
                    readerId: userId,
                });
            }
            catch (err) {
                console.error("MESSAGE READ ERROR:", err);
            }
        });
        // ===============================
        // DISCONNECT
        // ===============================
        socket.on("disconnect", () => {
            console.log("💬 Messages disconnected:", userId);
        });
    });
}
