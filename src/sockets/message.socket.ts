import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

interface JwtPayload {
  userId: string;
}

type AuthedSocket = Socket & {
  userId?: string;
};

const JWT_SECRET = process.env.JWT_SECRET as string;

function getConversationRoom(userA: string, userB: string) {
  return `conversation:${[userA, userB].sort().join(":")}`;
}

export function messageSocket(io: Server) {
  const nsp = io.of("/messages");

  // ===============================
  // 🔐 JWT MIDDLEWARE
  // ===============================
  nsp.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

      (socket as AuthedSocket).userId = decoded.userId;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  // ===============================
  // CONNECTION
  // ===============================
  nsp.on("connection", (socket: AuthedSocket) => {
    const userId = socket.userId!;
    console.log("💬 Messages connected:", userId);

    // Join personal room (critical for scaling)
    socket.join(`user:${userId}`);

    // ===============================
    // JOIN CONVERSATION ROOM
    // ===============================
    socket.on("conversation:join", ({ otherUserId }) => {
      if (!otherUserId) return;

      const room = getConversationRoom(userId, otherUserId);
      socket.join(room);
    });

    // ===============================
    // SEND MESSAGE
    // ===============================
    socket.on(
      "message:send",
      async (payload: {
        receiverId: string;
        text?: string;
        imageUrl?: string;
        audioUrl?: string;
        reaction?: string;
      }) => {
        try {
          const { receiverId, text, imageUrl, audioUrl, reaction } = payload;

          if (!receiverId) return;
          if (!text && !imageUrl && !audioUrl && !reaction) return;

          const message = await prisma.message.create({
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
        } catch (err) {
          console.error("MESSAGE SOCKET ERROR:", err);
          socket.emit("message:error", {
            message: "Failed to send message",
          });
        }
      }
    );

    // ===============================
    // MARK AS READ
    // ===============================
    socket.on(
      "message:read",
      async ({ otherUserId }: { otherUserId: string }) => {
        try {
          if (!otherUserId) return;

          await prisma.message.updateMany({
            where: {
              senderId: otherUserId,
              receiverId: userId,
              read: false,
            },
            data: { read: true },
          });

          const conversationRoom = getConversationRoom(
            userId,
            otherUserId
          );

          // Notify both users in conversation
          nsp.to(conversationRoom).emit("message:read:update", {
            readerId: userId,
          });
        } catch (err) {
          console.error("MESSAGE READ ERROR:", err);
        }
      }
    );

    // ===============================
    // DISCONNECT
    // ===============================
    socket.on("disconnect", () => {
      console.log("💬 Messages disconnected:", userId);
    });
  });
}