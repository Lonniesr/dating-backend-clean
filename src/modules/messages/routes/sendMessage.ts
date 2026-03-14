import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function sendMessage(
  req: Request<{ conversationId: string }>,
  res: Response
) {
  try {
    const userId = (req as any).user?.id;
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text required" });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const receiverId =
      conversation.userAId === userId
        ? conversation.userBId
        : conversation.userAId;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        receiverId,
        text: text.trim(),
      },
    });

    return res.json(message);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
}