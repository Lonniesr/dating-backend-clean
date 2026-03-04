import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/user/matches
 * Returns normalized match list for logged-in user
 */
router.get(
  "/user/matches",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        orderBy: { createdAt: "desc" },
        include: {
          userA: {
            select: {
              id: true,
              name: true,
              gender: true,
              race: true,
              photos: true,
              birthdate: true,
              location: true,
            },
          },
          userB: {
            select: {
              id: true,
              name: true,
              gender: true,
              race: true,
              photos: true,
              birthdate: true,
              location: true,
            },
          },
        },
      });

      // Normalize so frontend always gets "otherUser"
      const normalizedMatches = matches.map((match) => {
        const otherUser =
          match.userAId === userId ? match.userB : match.userA;

        return {
          id: match.id,
          createdAt: match.createdAt,
          user: otherUser,
        };
      });

      return res.json(normalizedMatches);
    } catch (err) {
      console.error("MATCH LIST ERROR:", err);
      return res.status(500).json({ error: "Failed to load matches" });
    }
  }
);

export default router;