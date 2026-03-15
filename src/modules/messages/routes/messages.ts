import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * Resolve conversation from either:
 *  - conversationId
 *  - receiverId
 */
async function resolveConversation(userId: string, id: string) {
  // First try conversationId
  let conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (conversation) {
    return conversation;
  }

  // Otherwise treat as receiverId
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
 * GET /api/messages/:id
 * Load chat history
 */
router.get("/:id", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const conversation = await resolveConversation(userId, id);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error("CHAT FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load chat." });
  }
});

/**
 * POST /api/messages/:id
 * Send message
 */
router.post("/:id", requireUser, async (req: any, res) => {
  try {
    const senderId = req.user.id;
    const id = req.params.id;

    const { text, imageUrl, audioUrl, replyToId } = req.body;

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { verified: true },
    });

    if (!sender) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!sender.verified && (imageUrl || audioUrl)) {
      return res.status(403).json({
        message: "Verify your profile to send photos and voice messages.",
      });
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

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        text,
        imageUrl,
        audioUrl,
        replyToId,
        conversationId: conversation.id,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    res.json(message);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
});

export default router;