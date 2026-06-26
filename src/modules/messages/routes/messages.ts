import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
import { sendPushNotification } from "../../../services/push";
import { activeChats } from "../../../server";
import getConversations from "./getConversations";

const router = Router();


/**
 * GET inbox conversations
 */
router.get("/", requireUser, getConversations);


/**
 * Resolve conversation
 */
async function resolveConversation(userId: string, id: string) {
  let conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (conversation) return conversation;

  conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: id },
        { userAId: id, userBId: userId },
      ],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userAId: userId,
        userBId: id,
      },
    });
  }

  return conversation;
}

/**
 * GET messages
 */
router.get("/:id", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const conversation = await resolveConversation(userId, id);

    const receiverId =
      conversation.userAId === userId
        ? conversation.userBId
        : conversation.userAId;

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: userId },
        ],
      },
    });

    const isBlocked = !!block;

    /* =========================
       🔥 FIX: USE PHOTOS RELATION
    ========================= */

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,

      include: {
        sender: {
          select: {
            id: true,
            photos: {
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    return res.json({
      messages: messages.reverse(),
      isBlocked,
    });

  } catch (err) {
    console.error("CHAT FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load chat." });
  }
});

/**
 * POST message
 */
router.post("/:id", requireUser, async (req: any, res) => {
  try {
    console.log("🔥 MESSAGE ROUTE HIT");

    const senderId = req.user.id;
    const id = req.params.id;

    const { text, imageUrl, audioUrl, replyToId } = req.body;

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { verified: true, name: true },
    });

    if (!sender) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const isMedia = !!imageUrl || !!audioUrl;

if (!sender.verified && isMedia) {
  return res.status(403).json({
    message: "Verify your profile to send photos and voice messages.",
  });
}

/* =========================
   NON-VERIFIED MESSAGE LIMIT
========================= */

if (!sender.verified) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const messagesSentToday = await prisma.message.count({
    where: {
      senderId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  console.log(
    "🔥 NON VERIFIED MESSAGES TODAY:",
    messagesSentToday
  );

  if (messagesSentToday >= 10) {
    return res.status(403).json({
      message:
        "Daily message limit reached. Verify your profile for unlimited messaging.",
    });
  }
}

if (!text && !imageUrl && !audioUrl) {
  return res.status(400).json({
    message: "Message cannot be empty.",
  });
}

    const conversation = await resolveConversation(senderId, id);

    const receiverId =
      conversation.userAId === senderId
        ? conversation.userBId
        : conversation.userAId;

    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });

    if (blocked) {
      return res.status(403).json({
        message: "You cannot message this user.",
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        text: text || null,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        replyToId: replyToId || null,
        conversationId: conversation.id,
      },
    });

    console.log("🔥 MESSAGE CREATED:", message);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    try {
  const io = req.app.get("io");

  if (io) {
    // 🔥 CONVERSATION ROOM (for chat UI)
    const room = `conversation:${[senderId, receiverId].sort().join(":")}`;

    io.to(`user:${receiverId}`).emit(
  "message:new",
  message
);

    // 🔔 USER ROOMS (for notifications)
    io.to(`user:${receiverId}`).emit("notification:message", {
      fromUserId: senderId,
      messageId: message.id,
    });

    // optional: sender (for consistency)

    console.log("🔥 Socket message emitted:", message.id);
  }
} catch (err) {
  console.error("❌ Socket emit error:", err);
}
    
  try {

  const activeChatUserId =
    activeChats.get(receiverId);

  const suppressPush =
    activeChatUserId &&
    activeChatUserId === senderId;

  console.log(
    "📱 RECEIVER ACTIVE CHAT:",
    activeChatUserId
  );

  console.log(
    "👤 SENDER:",
    senderId
  );

  console.log(
    "🔕 SUPPRESS PUSH:",
    suppressPush
  );

  if (!suppressPush) {

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { pushToken: true },
    });

    if (receiver?.pushToken) {

      await sendPushNotification({
        token: receiver.pushToken,

        title: "New message",

        body: message.text || "Sent you a message",

        data: {
          senderId: String(senderId),
        },
      });

      console.log("🔔 Push sent");

    }

  } else {

    console.log(
      "🔕 Push suppressed (active chat)"
    );

  }

} catch (err) {

  console.error("❌ Push error:", err);

}

    return res.json(message);

  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
});

export default router;