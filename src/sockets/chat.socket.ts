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
      console.log("👥 JOIN:", userId, "→", room);
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

          const socketsInRoom = await io.in(room).fetchSockets();

          const receiverInRoom = socketsInRoom.some(
            (s) => s.data.userId === receiverId
          );

          if (!receiverInRoom) {
            io.to(`user:${receiverId}`).emit("conversation:update", {
              conversationId: conversation.id,
              message,
            });

            io.to(`user:${receiverId}`).emit("notifications:update");
          }
        } catch (err) {
          console.error("CHAT MESSAGE ERROR:", err);
        }
      }
    );

    /* =========================
       🔥 TYPING (FINAL HARD FIX)
    ========================= */

    socket.on("typing:start", (...args: any[]) => {
      const payload = args[0];

      console.log("🔥 INCOMING typing:start:", payload);

      if (
        !payload ||
        typeof payload !== "object" ||
        !payload.to ||
        typeof payload.to !== "string"
      ) {
        console.log("❌ INVALID typing:start payload:", payload);
        return;
      }

      const room = getConversationRoom(userId, payload.to);

      const data = {
        fromUserId: userId,
      };

      console.log("⌨️ EMIT typing:start:", data);

      io.to(room).emit("typing:start", data);
      io.to(`user:${payload.to}`).emit("typing:start", data);
    });

    socket.on("typing:stop", (...args: any[]) => {
      const payload = args[0];

      console.log("🔥 INCOMING typing:stop:", payload);

      if (
        !payload ||
        typeof payload !== "object" ||
        !payload.to ||
        typeof payload.to !== "string"
      ) {
        console.log("❌ INVALID typing:stop payload:", payload);
        return;
      }

      const room = getConversationRoom(userId, payload.to);

      const data = {
        fromUserId: userId,
      };

      console.log("⌨️ EMIT typing:stop:", data);

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