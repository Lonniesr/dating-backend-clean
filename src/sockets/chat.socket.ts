import { Server, Socket } from "socket.io";
import prisma from "../prisma";
import { socketAuth } from "../middleware/socketAuth";

export function registerChatSocket(io: Server) {
  const chatNamespace = io.of("/chat");

  // 🔐 Centralized auth
  chatNamespace.use(socketAuth());

  chatNamespace.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`💬 Chat connected: ${userId}`);

    socket.join(`user:${userId}`);

    chatNamespace.emit("user:presence", {
      userId,
      online: true,
    });

    // ================================
    // SEND MESSAGE
    // ================================
    socket.on("message:send", async (payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;

      const { tempId, receiverId, text } = payload as {
        tempId?: string;
        receiverId?: string;
        text?: string;
      };

      if (
        typeof receiverId !== "string" ||
        typeof text !== "string" ||
        text.length === 0 ||
        text.length > 2000
      ) {
        return;
      }

      if (receiverId === userId) return;

      try {
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
        });

        if (!receiver) return;

        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId,
            text,
            delivered: false,
            read: false,
          },
        });

        chatNamespace.to(`user:${receiverId}`).emit("message:new", message);

        socket.emit("message:delivered", {
          tempId,
          messageId: message.id,
        });
      } catch (err) {
        console.error("Message error:", err);
      }
    });

    // ================================
    // TYPING
    // ================================
    socket.on("typing:start", (payload: { toUserId?: string }) => {
      const { toUserId } = payload || {};
      if (typeof toUserId !== "string") return;

      chatNamespace.to(`user:${toUserId}`).emit("typing:start", {
        fromUserId: userId,
      });
    });

    socket.on("typing:stop", (payload: { toUserId?: string }) => {
      const { toUserId } = payload || {};
      if (typeof toUserId !== "string") return;

      chatNamespace.to(`user:${toUserId}`).emit("typing:stop", {
        fromUserId: userId,
      });
    });

    // ================================
    // READ RECEIPT
    // ================================
    socket.on("message:read", async (payload: { messageId?: string }) => {
      const { messageId } = payload || {};
      if (typeof messageId !== "string") return;

      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message || message.receiverId !== userId) return;

        await prisma.message.update({
          where: { id: messageId },
          data: { read: true },
        });

        chatNamespace.to(`user:${message.senderId}`).emit("message:read", {
          messageId,
        });
      } catch (err) {
        console.error("Read receipt error:", err);
      }
    });

    // ================================
    // DISCONNECT (Redis-safe presence)
    // ================================
    socket.on("disconnect", async () => {
      console.log(`💬 Chat disconnected: ${userId}`);

      const sockets = await chatNamespace.in(`user:${userId}`).fetchSockets();

      if (sockets.length === 0) {
        chatNamespace.emit("user:presence", {
          userId,
          online: false,
        });
      }
    });
  });
}