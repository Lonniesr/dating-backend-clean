import { Request, Response } from "express";
import prisma from "../../../prisma";

async function resolveConversation(userId: string, id: string) {

  // 1️⃣ try conversationId first
  let conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (conversation) {
    return conversation;
  }

  // 2️⃣ otherwise treat as otherUserId
  conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: id },
        { userAId: id, userBId: userId },
      ],
    },
  });

  // 3️⃣ create conversation if none exists
  if (!conversation) {

    // normalize order so duplicates never happen
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
  req: Request<{ id: string }>,
  res: Response
) {
  try {

    const senderId = (req as any).user?.id;
    const id = req.params.id;
    const { text } = req.body;

    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text required" });
    }

    /* =========================
       RESOLVE CONVERSATION
    ========================= */

    const conversation = await resolveConversation(senderId, id);

    /* =========================
       DETERMINE RECEIVER
    ========================= */

    const receiverId =
      conversation.userAId === senderId
        ? conversation.userBId
        : conversation.userAId;

    /* =========================
       CREATE MESSAGE
    ========================= */

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        text: text.trim(),
      },
    });

    /* =========================
       UPDATE CONVERSATION
    ========================= */

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