import { Request, Response } from "express";
import prisma from "../../../prisma";
import { activeChats } from "../../../server";
import { sendPushNotification } from "../../../services/push";

async function resolveConversation(userId: string, id: string) {

  // try conversationId first
  let conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (conversation) return conversation;

  // otherwise treat as otherUserId
  conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: id },
        { userAId: id, userBId: userId },
      ],
    },
  });

  if (!conversation) {
    const [userAId, userBId] = [userId, id].sort();

    conversation = await prisma.conversation.create({
      data: {
        userAId,
        userBId,
      },
    });
  }

  return conversation;
}

export default async function sendMessage(
  req: Request<{ conversationId: string }>,
  res: Response
) {
  try {

    const senderId = (req as any).user?.id;
    const id = req.params.conversationId;
    const { text } = req.body;

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text required" });
    }

    const conversation = await resolveConversation(senderId, id);

    const receiverId =
      conversation.userAId === senderId
        ? conversation.userBId
        : conversation.userAId;

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        text: text.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: new Date(),
        lastMessageId: message.id,
      },
    });

    /* =========================
   🔔 PUSH NOTIFICATION
========================= */

try {

  const activeChat = activeChats.get(receiverId);

  // 🚫 SUPPRESS if recipient already viewing this chat
  const suppressPush = activeChat === senderId;

  if (!suppressPush) {

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: {
        pushToken: true,
        name: true,
      },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: {
        name: true,
      },
    });

    if (receiver?.pushToken) {

      await sendPushNotification({
        token: receiver.pushToken,

        title: sender?.name || "New message",

        body: text.trim(),

        data: {
          type: "chat",
          userId: senderId,
        },
      });

      console.log("🔔 Push notification sent");

    } else {

      console.log("⚠️ No push token");

    }

  } else {

    console.log("🔕 Push suppressed (active chat)");

  }

} catch (err) {

  console.error("❌ PUSH ERROR:", err);

}

    return res.json(message);

  } catch (err) {

    console.error("SEND MESSAGE ERROR:", err);

    return res.status(500).json({
      error: "Failed to send message",
    });

  }
}