"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatSocket = registerChatSocket;
console.log("🚨 BACKEND VERSION 131175a");
const prisma_1 = __importDefault(require("../prisma"));
const socketAuth_1 = require("../middleware/socketAuth");
function getConversationRoom(a, b) {
    return `conversation:${[a, b].sort().join(":")}`;
}
function registerChatSocket(io) {
    io.use((0, socketAuth_1.socketAuth)());
    io.on("connection", async (socket) => {
        const userId = socket.data.userId;
        console.log("🔥 SOCKET DATA:", socket.data);
        if (!userId) {
            socket.disconnect();
            return;
        }
        console.log("💬 Chat connected:", userId);
        // 🔥 UPDATE LAST ACTIVE
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                lastActiveAt: new Date(),
            },
        });
        socket.join(`user:${userId}`);
        io.emit("presence:update", {
            userId,
            online: true,
        });
        console.log("📡 EMITTING PRESENCE:", userId);
        /* =========================
           JOIN USER ROOM
        ========================= */
        socket.on("chat:join", async (id) => {
            if (!id)
                return;
            socket.join(`user:${id}`);
            socket.data.userId = id;
            console.log("👤 CHAT JOIN:", id);
            // 🔥 UPDATE LAST ACTIVE
            await prisma_1.default.user.update({
                where: { id },
                data: {
                    lastActiveAt: new Date(),
                },
            });
            io.emit("presence:update", {
                userId: id,
                online: true,
            });
        });
        /* =========================
           JOIN CONVERSATION
        ========================= */
        socket.on("conversation:join", ({ otherUserId }) => {
            if (!otherUserId)
                return;
            const room = getConversationRoom(userId, otherUserId);
            socket.join(room);
            console.log("👥 JOIN:", userId, "→", room);
            const clients = io.sockets.adapter.rooms.get(room);
            console.log("👥 ROOM USERS:", room, clients ? Array.from(clients) : "none", "COUNT:", (clients === null || clients === void 0 ? void 0 : clients.size) || 0);
        });
        /* =========================
           SEND MESSAGE
        ========================= */
        socket.on("message:send", async ({ receiverId, text }) => {
            console.log("🚨 SOCKET MESSAGE:send HIT", {
                userId,
                receiverId,
                text,
            });
            if (!receiverId || !text)
                return;
            try {
                // 🔥 UPDATE LAST ACTIVE
                await prisma_1.default.user.update({
                    where: { id: userId },
                    data: {
                        lastActiveAt: new Date(),
                    },
                });
                const match = await prisma_1.default.match.findFirst({
                    where: {
                        OR: [
                            { userAId: userId, userBId: receiverId },
                            { userAId: receiverId, userBId: userId },
                        ],
                    },
                });
                if (!match)
                    return;
                let conversation = await prisma_1.default.conversation.findFirst({
                    where: {
                        OR: [
                            { userAId: userId, userBId: receiverId },
                            { userAId: receiverId, userBId: userId },
                        ],
                    },
                });
                if (!conversation) {
                    conversation = await prisma_1.default.conversation.create({
                        data: {
                            userAId: userId,
                            userBId: receiverId,
                        },
                    });
                }
                const message = await prisma_1.default.message.create({
                    data: {
                        senderId: userId,
                        receiverId,
                        text,
                        conversationId: conversation.id,
                        read: false,
                    },
                });
                await prisma_1.default.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        lastMessageId: message.id,
                        updatedAt: new Date(),
                    },
                });
                const room = getConversationRoom(userId, receiverId);
                io.to(room).emit("message:new", message);
                io.to(`user:${receiverId}`).emit("conversation:update", {
                    conversationId: conversation.id,
                    message,
                });
                io.to(`user:${receiverId}`).emit("notifications:update");
            }
            catch (err) {
                console.error("CHAT MESSAGE ERROR:", err);
            }
        });
        /* =========================
           TYPING
        ========================= */
        socket.on("typing:start", async (payload) => {
            if (!(payload === null || payload === void 0 ? void 0 : payload.to))
                return;
            // 🔥 UPDATE LAST ACTIVE
            await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    lastActiveAt: new Date(),
                },
            });
            const room = getConversationRoom(userId, payload.to);
            const data = { fromUserId: userId };
            io.to(room).emit("typing:start", data);
            io.to(`user:${payload.to}`).emit("typing:start", data);
        });
        socket.on("typing:stop", (payload) => {
            if (!(payload === null || payload === void 0 ? void 0 : payload.to))
                return;
            const room = getConversationRoom(userId, payload.to);
            const data = { fromUserId: userId };
            io.to(room).emit("typing:stop", data);
            io.to(`user:${payload.to}`).emit("typing:stop", data);
        });
        /* =========================
           READ RECEIPTS
        ========================= */
        socket.on("message:read", async ({ otherUserId }) => {
            if (!otherUserId)
                return;
            // 🔥 UPDATE LAST ACTIVE
            await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    lastActiveAt: new Date(),
                },
            });
            await prisma_1.default.message.updateMany({
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    read: false,
                },
                data: { read: true },
            });
            const room = getConversationRoom(userId, otherUserId);
            io.to(room).emit("message:read:update", {
                readerId: userId,
            });
            io.to(`user:${otherUserId}`).emit("notifications:update");
        });
        /* =========================
           MESSAGE REACTIONS
        ========================= */
        /* =========================
           MESSAGE REACTIONS
        ========================= */
        socket.on("message:reaction", async ({ messageId, emoji, otherUserId, }) => {
            console.log("🔥 REACTION RECEIVED", {
                from: userId,
                messageId,
                emoji,
                otherUserId,
            });
            if (!messageId || !emoji || !otherUserId) {
                return;
            }
            try {
                await prisma_1.default.message.update({
                    where: {
                        id: messageId,
                    },
                    data: {
                        reaction: emoji,
                    },
                });
                const room = getConversationRoom(userId, otherUserId);
                io.to(room).emit("message:reaction:update", {
                    messageId,
                    emoji,
                });
            }
            catch (err) {
                console.error("REACTION ERROR:", err);
            }
        });
        /* =========================
           DISCONNECT
        ========================= */
        socket.on("disconnect", () => {
            console.log("💬 Chat disconnected:", userId);
            io.emit("presence:update", {
                userId,
                online: false,
            });
        });
    });
}
