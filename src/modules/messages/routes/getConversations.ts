import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function getConversations(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            photos: {
              where: {
                order: 0,
              },
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
        userB: {
          select: {
            id: true,
            name: true,
            photos: {
              where: {
                order: 0,
              },
              select: {
                url: true,
              },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const results = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser =
          conversation.userAId === userId
            ? conversation.userB
            : conversation.userA;

        const unreadCount =
          await prisma.message.count({
            where: {
              conversationId: conversation.id,
              receiverId: userId,
              read: false,
            },
          });

        return {
          conversationId: conversation.id,

          user: {
            id: otherUser.id,
            name: otherUser.name,
            avatar:
              otherUser.photos?.[0]?.url || null,
          },

          lastMessage:
            conversation.messages[0]
              ? {
                  text:
                    conversation.messages[0].text,
                  createdAt:
                    conversation.messages[0]
                      .createdAt,
                }
              : null,

          unreadCount,
        };
      })
    );

    return res.json(results);
  } catch (err) {
    console.error(
      "GET CONVERSATIONS ERROR:",
      err
    );

    return res.status(500).json({
      error: "Failed to load conversations",
    });
  }
}