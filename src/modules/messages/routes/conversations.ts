import { Router, Request, Response } from "express";
import { requireUser } from "../../../middleware/requireUser";
import prisma from "../../../prisma";

const router = Router();

/**
 * GET /api/conversations
 * Returns all conversations for the logged-in user
 */
router.get(
  "/",
  requireUser,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.id;

      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        include: {
          userA: true,
          userB: true,
          lastMessage: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      const formatted = await Promise.all(
        conversations.map(async (c: typeof conversations[number]) => {
          const other =
            c.userAId === userId ? c.userB : c.userA;

          if (!other) return null;

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
              avatar: Array.isArray(other.photos)
                ? other.photos[0] ?? null
                : null,
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

      res.json(formatted.filter(Boolean));
    } catch (err) {
      console.error("CONVERSATIONS ERROR:", err);
      res.status(500).json({
        message: "Failed to load conversations.",
      });
    }
  }
);

export default router;