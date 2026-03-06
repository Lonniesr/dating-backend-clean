import { Server, Socket } from "socket.io";
import prisma from "../prisma";
import { socketAuth } from "../middleware/socketAuth";

function getConversationRoom(a: string, b: string) {
  return `conversation:${[a, b].sort().join(":")}`;
}

export function registerChatSocket(io: Server) {
  const nsp = io.of("/chat");

  nsp.use(socketAuth());

  nsp.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log("💬 Chat connected:", userId);

    socket.join(`user:${userId}`);

    // =========================
    // JOIN CONVERSATION
    // =========================
    socket.on("conversation:join", ({ otherUserId }) => {
      if (!otherUserId) return;

      const room = getConversationRoom(userId, otherUserId);
      socket.join(room);
    });

    // =========================
    // SEND MESSAGE
    // =========================
    socket.on(
      "message:send",
      async ({ receiverId, text }: { receiverId: string; text: string }) => {
        if (!receiverId || !text || text.length === 0) return;

        try {
          // Verify match
          const match = await prisma.match.findFirst({
            where: {
              OR: [
                { userAId: userId, userBId: receiverId },
                { userAId: receiverId, userBId: userId },
              ],
            },
          });

          if (!match) return;

          // Find conversation
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

          nsp.to(room).emit("message:new", message);

          nsp.to(`user:${receiverId}`).emit("conversation:update", {
            conversationId: conversation.id,
          });
        } catch (err) {
          console.error("CHAT MESSAGE ERROR:", err);
        }
      }
    );

    // =========================
    // TYPING
    // =========================
    socket.on("typing:start", ({ toUserId }) => {
      if (!toUserId) return;

      const room = getConversationRoom(userId, toUserId);

      nsp.to(room).emit("typing:start", {
        fromUserId: userId,
      });
    });

    socket.on("typing:stop", ({ toUserId }) => {
      if (!toUserId) return;

      const room = getConversationRoom(userId, toUserId);

      nsp.to(room).emit("typing:stop", {
        fromUserId: userId,
      });
    });

    // =========================
    // READ RECEIPT
    // =========================
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

      nsp.to(room).emit("message:read:update", {
        readerId: userId,
      });
    });

    socket.on("disconnect", () => {
      console.log("💬 Chat disconnected:", userId);
    });
  });
}