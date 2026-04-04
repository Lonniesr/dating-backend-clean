import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/swipe
 *
 * Query params:
 * - cursor: string (last swipe id)
 * - limit: number (default 50, max 100)
 * - from: ISO date
 * - to: ISO date
 * - liked: "true" | "false"
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      cursor,
      limit = "50",
      from,
      to,
      liked,
    } = req.query;

    const take = Math.min(parseInt(limit as string, 10) || 50, 100);

    // 🔍 Build filters
    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    if (liked === "true") where.liked = true;
    if (liked === "false") where.liked = false;

    // 📦 Fetch swipes
    const swipes = await prisma.swipe.findMany({
      where,
      orderBy: { createdAt: "desc" },

      take: take + 1, // for next cursor detection

      ...(cursor && {
        skip: 1,
        cursor: { id: cursor as string },
      }),

      include: {
        swiper: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        target: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 🔄 Pagination logic
    let nextCursor: string | null = null;

    if (swipes.length > take) {
      const nextItem = swipes.pop();
      nextCursor = nextItem!.id;
    }

    // 🔧 Normalize response
    const formatted = swipes.map((swipe) => ({
      id: swipe.id,
      liked: swipe.liked,
      superLike: swipe.superLike,
      createdAt: swipe.createdAt,

      swiper: swipe.swiper
        ? {
            id: swipe.swiper.id,
            username:
              swipe.swiper.username ||
              swipe.swiper.name ||
              "Unknown",
            email: swipe.swiper.email,
          }
        : null,

      target: swipe.target
        ? {
            id: swipe.target.id,
            username:
              swipe.target.username ||
              swipe.target.name ||
              "Unknown",
            email: swipe.target.email,
          }
        : null,
    }));

    // 📊 Analytics (based on current filter set)
    const totalCount = await prisma.swipe.count({ where });
    const likedCount = await prisma.swipe.count({
      where: { ...where, liked: true },
    });

    const likeRate =
      totalCount > 0 ? (likedCount / totalCount) * 100 : 0;

    return res.json({
      swipes: formatted,
      nextCursor,
      analytics: {
        totalSwipes: totalCount,
        likedSwipes: likedCount,
        likeRate: Number(likeRate.toFixed(2)),
      },
    });
  } catch (err) {
    console.error("ADMIN SWIPE ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch swipes",
    });
  }
});

export default router;