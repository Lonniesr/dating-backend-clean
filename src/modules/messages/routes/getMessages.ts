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
       MARK MESSAGES AS READ
    ========================= */

    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        read: false
      },
      data: {
        read: true
      }
    });

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

    return res.json(messages);

  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    return res.status(500).json({ error: "Failed to load messages" });
  }
}