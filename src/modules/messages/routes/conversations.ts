import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

/**
 * GET /api/conversations
 * Returns all conversations for the logged-in user
 */
router.get("/", requireUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          include: {
            photos: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        userB: {
          include: {
            photos: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        lastMessage: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formatted = await Promise.all(
      conversations.map(async (c) => {
        const other = c.userAId === userId ? c.userB : c.userA;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            receiverId: userId,
            read: false,
          },
        });

        return {
          conversationId: c.id,
          user: {
            id: other.id,
            name: other.name,
            avatar: other.photos?.[0]?.url ?? null,
            online: false,
          },
          lastMessage: c.lastMessage
            ? {
                id: c.lastMessage.id,
                text: c.lastMessage.text,
                createdAt: c.lastMessage.createdAt,
                read: c.lastMessage.read,
                senderId: c.lastMessage.senderId,
              }
            : null,
          unreadCount,
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error("CONVERSATIONS ERROR:", err);
    res.status(500).json({
      message: "Failed to load conversations.",
    });
  }
});

export default router;