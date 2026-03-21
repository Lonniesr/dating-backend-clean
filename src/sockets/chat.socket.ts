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
       JOIN USER ROOM (NEW)
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
    });

    /* =========================
       SEND MESSAGE
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

    socket.on("typing:start", ({ toUserId }) => {
      if (!toUserId) return;

      const room = getConversationRoom(userId, toUserId);

      io.to(room).emit("typing:start", {
        fromUserId: userId,
      });
    });

    socket.on("typing:stop", ({ toUserId }) => {
      if (!toUserId) return;

      const room = getConversationRoom(userId, toUserId);

      io.to(room).emit("typing:stop", {
        fromUserId: userId,
      });
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