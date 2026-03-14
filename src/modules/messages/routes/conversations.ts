import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/*
GET /api/conversations/:matchId
Find or create conversation between users
*/

router.get("/:matchId", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const matchId = req.params.matchId as string;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            userAId: userId,
            userBId: matchId
          },
          {
            userAId: matchId,
            userBId: userId
          }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: userId,
          userBId: matchId
        }
      });
    }

    res.json(conversation);

  } catch (err) {
    console.error("CONVERSATION ERROR:", err);
    res.status(500).json({ error: "Failed to load conversation" });
  }
});

export default router;