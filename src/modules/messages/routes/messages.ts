import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/messages/:id
 * Returns chat history with a specific user
 */
router.get("/:id", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.id;

    // Ensure users are matched
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherId },
          { userAId: otherId, userBId: userId },
        ],
      },
    });

    if (!match) {
      return res
        .status(403)
        .json({ message: "You can only message users you matched with." });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherId },
          { userAId: otherId, userBId: userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: userId,
          userBId: otherId,
        },
      });
    }

    // Fetch latest 50 messages
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Mark unread messages as read
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
 * Send a message to a specific user
 */
router.post("/:id", requireUser, async (req: any, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    // Ensure users are matched
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (!match) {
      return res
        .status(403)
        .json({ message: "You can only message users you matched with." });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: senderId,
          userBId: receiverId,
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        text,
        conversationId: conversation.id,
      },
    });

    // Update conversation
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