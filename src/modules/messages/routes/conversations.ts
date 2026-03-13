import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/conversations
 * Conversation preview list
 */
router.get("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            photos: {
              select: { url: true },
              take: 1
            }
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            photos: {
              select: { url: true },
              take: 1
            }
          }
        },
        lastMessage: true
      }
    });

    const formatted = await Promise.all(
      conversations.map(async (c) => {

        const other =
          c.userAId === userId ? c.userB : c.userA;

        const unread = await prisma.message.count({
          where: {
            conversationId: c.id,
            receiverId: userId,
            read: false
          }
        });

        return {
          conversationId: c.id,
          user: {
            id: other.id,
            name: other.name,
            avatar: other.photos[0]?.url || null
          },
          lastMessage: c.lastMessage
            ? {
                text: c.lastMessage.text,
                createdAt: c.lastMessage.createdAt
              }
            : null,
          unreadCount: unread
        };
      })
    );

    res.json(formatted);

  } catch (err) {
    console.error("CONVERSATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

export default router;