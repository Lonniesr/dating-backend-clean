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

      /* =========================
         NEW: BLOCK LOOKUP
      ========================= */
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

/* =========================
   MARK MATCHES AS SEEN
========================= */

await prisma.match.updateMany({
  where: {
    userAId: userId,
    userASeen: false,
  },
  data: {
    userASeen: true,
  },
});

await prisma.match.updateMany({
  where: {
    userBId: userId,
    userBSeen: false,
  },
  data: {
    userBSeen: true,
  },
});

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
              location: true,
              birthdate: true,
              photos: {
                select: { url: true },
                orderBy: { order: "asc" },
              },
            },
          },
          userB: {
            select: {
              id: true,
              name: true,
              gender: true,
              location: true,
              birthdate: true,
              photos: {
                select: { url: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });

      const normalized = matches
        .map((match) => {
          const otherUser =
            match.userAId === userId ? match.userB : match.userA;

          return {
            id: otherUser.id,
            name: otherUser.name,
            gender: otherUser.gender,
            location: otherUser.location,
            birthdate: otherUser.birthdate,
            photos: otherUser.photos.map((p) => p.url),
          };
        })
        /* =========================
           NEW: FILTER BLOCKED
        ========================= */
        .filter((u) => !blockedIds.has(u.id));

      res.json(normalized);

    } catch (err) {
      console.error("MATCH LIST ERROR:", err);
      res.status(500).json({ error: "Failed to load matches" });
    }
  }
);

export default router;