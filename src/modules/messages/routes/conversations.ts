import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser, AuthUser } from "../../../middleware/requireUser";

const router = Router();

/* ============================
   GET USER CONVERSATIONS
============================ */

router.get("/", requireUser, async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId: string = user.id;

    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      },
      select: {
        blockerId: true,
        blockedId: true
      }
    });

    const blockedIds = new Set<string>();

    for (const b of blocks) {
      if (b.blockerId === userId) blockedIds.add(b.blockedId);
      if (b.blockedId === userId) blockedIds.add(b.blockerId);
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

    const formatted = await Promise.all(
      conversations.map(async (c) => {

        const otherUser =
          c.userAId === userId ? c.userB : c.userA;

        if (!otherUser) return null;

        if (blockedIds.has(otherUser.id)) return null;

        const lastMessage = c.messages[0] || null;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            receiverId: userId,
            read: false
          }
        });

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
          unreadCount
        };
      })
    );

    res.json(formatted.filter(Boolean));

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
    const user = req.user as AuthUser;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId: string = user.id;

    /* ✅ FIX: Properly narrow matchId */
    const matchParam = req.params.matchId;

    if (typeof matchParam !== "string") {
      return res.status(400).json({ error: "Invalid matchId" });
    }

    const matchId = matchParam;

    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: matchId },
          { blockerId: matchId, blockedId: userId }
        ]
      }
    });

    if (blocked) {
      return res.status(403).json({
        error: "You cannot interact with this user"
      });
    }

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