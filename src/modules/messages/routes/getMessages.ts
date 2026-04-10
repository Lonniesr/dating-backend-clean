import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function getMessages(
  req: Request<{ conversationId: string }>,
  res: Response
) {
  try {
    const userId = (req as any).user?.id;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    /* =========================
       GET CONVERSATION
    ========================= */

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    /* =========================
       SECURITY CHECK
    ========================= */

    if (
      conversation.userAId !== userId &&
      conversation.userBId !== userId
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    /* =========================
       GET OTHER USER
    ========================= */

    const otherUserId =
      conversation.userAId === userId
        ? conversation.userBId
        : conversation.userAId;

    /* =========================
       CHECK BLOCK STATUS
    ========================= */

    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });

    const isBlocked = !!block;

    /* =========================
       MARK MESSAGES AS READ
    ========================= */

    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    /* =========================
       GET MESSAGES
    ========================= */

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        text: true,
        imageUrl: true,
        audioUrl: true,
        createdAt: true,
        read: true,
      },
    });

    /* =========================
       RETURN RESPONSE
    ========================= */

    return res.json({
      messages,
      isBlocked,
    });

  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    return res.status(500).json({ error: "Failed to load messages" });
  }
}