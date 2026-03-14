import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/* ============================
   GET USER CONVERSATIONS
============================ */

router.get("/", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            photos: true
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            photos: true
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const formatted = conversations.map((c) => {
      const otherUser = c.userAId === userId ? c.userB : c.userA;
      const lastMessage = c.messages[0] || null;

      return {
        conversationId: c.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.photos?.[0]?.url ?? null
        },
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              createdAt: lastMessage.createdAt
            }
          : null,
        unreadCount: 0
      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("GET CONVERSATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

/* ============================
   GET OR CREATE CONVERSATION
============================ */

router.get("/:matchId", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const matchId = req.params.matchId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Normalize user order so duplicates can't happen
    const [userAId, userBId] = [userId, matchId].sort();

    const conversation = await prisma.conversation.upsert({
      where: {
        userAId_userBId: {
          userAId,
          userBId
        }
      },
      update: {},
      create: {
        userAId,
        userBId
      }
    });

    res.json(conversation);

  } catch (err) {
    console.error("CONVERSATION ERROR:", err);
    res.status(500).json({ error: "Failed to load conversation" });
  }
});

export default router;