import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function getMatches(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matches = await prisma.match.findMany({
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
            photos: true,
            gender: true
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            photos: true,
            gender: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
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
        photos: true,
      },
    },
  },
});

    const formatted = matches.map((m: typeof matches[number]) => {
      const other =
        m.userAId === userId ? m.userB : m.userA;

      const photos = Array.isArray(other.photos)
        ? other.photos.map((p: any) =>
            typeof p === "string" ? p : p?.url
          ).filter(Boolean)
        : [];

      return {
        id: other.id,
        name: other.name,
        gender: other.gender,
        photos
      };
    });
const formattedLikes = likes.map((like) => {
  const photos = Array.isArray(like.swiper.photos)
    ? like.swiper.photos
        .map((p: any) =>
          typeof p === "string" ? p : p?.url
        )
        .filter(Boolean)
    : [];

  return {
    id: like.swiper.id,
    name: like.swiper.name,
    gender: like.swiper.gender,
    photos,
  };
});
const matchedIds = new Set(
  formatted.map((m) => m.id)
);

const filteredLikes = formattedLikes.filter(
  (like) => !matchedIds.has(like.id)
);
console.log("🔥 MATCHES:", formatted.length);
console.log("🔥 LIKES:", filteredLikes.length);

return res.json({
  matches: formatted,
  likes: filteredLikes,
});
  } catch (err) {
    console.error("GET MATCHES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}