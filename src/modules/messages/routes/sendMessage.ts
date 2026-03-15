import { Request, Response } from "express";
import prisma from "../../../prisma";

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

    return res.json(message);

  } catch (err) {

    console.error("SEND MESSAGE ERROR:", err);

    return res.status(500).json({
      error: "Failed to send message",
    });

  }
}