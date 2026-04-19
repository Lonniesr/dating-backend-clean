import { Server, Socket } from "socket.io";
import prisma from "../prisma";
import { socketAuth } from "../middleware/socketAuth";

function getConversationRoom(a: string, b: string) {
  return `conversation:${[a, b].sort().join(":")}`;
}

export function registerChatSocket(io: Server) {
  io.use(socketAuth());

  const onlineUsers = new Set<string>();

  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log("💬 Chat connected:", userId);

    onlineUsers.add(userId);

    socket.join(`user:${userId}`);

    io.emit("presence:update", {
      userId,
      online: true,
    });

    /* =========================
       JOIN USER ROOM
    ========================= */

    socket.on("chat:join", (id: string) => {
      if (!id) return;
      socket.join(`user:${id}`);
    });

    /* =========================
       JOIN CONVERSATION
    ========================= */

    socket.on("conversation:join", ({ otherUserId }) => {
      if (!otherUserId) return;

      const room = getConversationRoom(userId, otherUserId);

      socket.join(room);

      console.log("👥 JOIN:", userId, "→", room);

      // 🔥 DEBUG: how many users are in this room RIGHT NOW
      const clients = io.sockets.adapter.rooms.get(room);

      console.log(
        "👥 ROOM USERS:",
        room,
        clients ? Array.from(clients) : "none",
        "COUNT:",
        clients?.size || 0
      );
    });

    /* =========================
       SEND MESSAGE (FIXED)
    ========================= */

    socket.on(
      "message:send",
      async ({ receiverId, text }: { receiverId: string; text: string }) => {
        if (!receiverId || !text) return;

        try {
          const match = await prisma.match.findFirst({
            where: {
              OR: [
                { userAId: userId, userBId: receiverId },
                { userAId: receiverId, userBId: userId },
              ],
            },
          });

          if (!match) return;

          let conversation = await prisma.conversation.findFirst({
            where: {
              OR: [
                { userAId: userId, userBId: receiverId },
                { userAId: receiverId, userBId: userId },
              ],
            },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                userAId: userId,
                userBId: receiverId,
              },
            });
          }

          const message = await prisma.message.create({
            data: {
              senderId: userId,
              receiverId,
              text,
              conversationId: conversation.id,
              read: false,
            },
          });

          await prisma.conversation.update({
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

        } catch (err) {
          console.error("CHAT MESSAGE ERROR:", err);
        }
      }
    );

    /* =========================
       TYPING
    ========================= */

    socket.on("typing:start", (payload: any) => {
      if (!payload?.to) return;

      const room = getConversationRoom(userId, payload.to);

      const data = { fromUserId: userId };

      io.to(room).emit("typing:start", data);
      io.to(`user:${payload.to}`).emit("typing:start", data);
    });

    socket.on("typing:stop", (payload: any) => {
      if (!payload?.to) return;

      const room = getConversationRoom(userId, payload.to);

      const data = { fromUserId: userId };

      io.to(room).emit("typing:stop", data);
      io.to(`user:${payload.to}`).emit("typing:stop", data);
    });

    /* =========================
       READ RECEIPTS
    ========================= */

    socket.on("message:read", async ({ otherUserId }) => {
      if (!otherUserId) return;

      await prisma.message.updateMany({
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
       DISCONNECT
    ========================= */

    socket.on("disconnect", () => {
      console.log("💬 Chat disconnected:", userId);

      onlineUsers.delete(userId);

      io.emit("presence:update", {
        userId,
        online: false,
      });
    });
  });
}