import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
console.log("🔥 MATCH.TS FILE LOADED");
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
      console.log("🔥 MATCH ROUTE HIT BY:", userId);

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
              shadowBanned: true,
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
              shadowBanned: true,
              photos: {
                select: { url: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });

const likes = await prisma.swipe.findMany({
  where: {
    targetId: userId,
    liked: true,
  },
  include: {
    swiper: {
      select: {
        id: true,
        name: true,
        gender: true,
        location: true,
        birthdate: true,
        shadowBanned: true,
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
            shadowBanned: otherUser.shadowBanned,
          };

        })
        /* =========================
           NEW: FILTER BLOCKED
        ========================= */
.filter(
  (u) =>
    !blockedIds.has(u.id) &&
    !(u as any).shadowBanned
);
        const normalizedLikes = likes
  .map((like) => ({
    id: like.swiper.id,
    name: like.swiper.name,
    gender: like.swiper.gender,
    location: like.swiper.location,
    birthdate: like.swiper.birthdate,
    photos: like.swiper.photos.map((p) => p.url),
    shadowBanned: like.swiper.shadowBanned,
  }))
  .filter((u) => !blockedIds.has(u.id));

  console.log("🔥 NEW MATCH ROUTE ACTIVE");
console.log("🔥 MATCHES:", normalized.length);
console.log("🔥 LIKES:", normalizedLikes.length);
console.log("🔥 RETURNING MATCHES:", normalized.length);
console.log("🔥 RETURNING LIKES:", normalizedLikes.length);
res.json({
  matches: normalized,
  likes: normalizedLikes,
});

    } catch (err) {
      console.error("MATCH LIST ERROR:", err);
      res.status(500).json({ error: "Failed to load matches" });
    }
  }
);

export default router;