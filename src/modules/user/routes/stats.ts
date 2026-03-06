import { Router } from "express";
import prisma from "../../../prisma";
import { startOfDay, subDays } from "date-fns";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * GET /api/stats
 * Platform analytics
 */
router.get("/", requireUser, async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);

    // -------- USERS --------
    const totalUsers = await prisma.user.count();

    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: { gte: today },
      },
    });

    const newUsersWeek = await prisma.user.count({
      where: {
        createdAt: { gte: weekAgo },
      },
    });

    // -------- ACTIVITY --------
    const swipesToday = await prisma.swipe.count({
      where: {
        createdAt: { gte: today },
      },
    });

    const matchesToday = await prisma.match.count({
      where: {
        createdAt: { gte: today },
      },
    });

    // -------- TOTALS --------
    const totalMatches = await prisma.match.count();
    const totalMessages = await prisma.message.count();
    const totalSwipes = await prisma.swipe.count();

    // -------- MATCH RATE --------
    const matchRate =
      totalSwipes > 0 ? ((totalMatches / totalSwipes) * 100).toFixed(2) : 0;

    // -------- GENDER DISTRIBUTION --------
    const genderDistribution =
      (await prisma.user
        .groupBy({
          by: ["gender"],
          _count: {
            gender: true,
          },
        })
        .catch(() => [])) || [];

    return res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newWeek: newUsersWeek,
        },

        activity: {
          swipesToday,
          matchesToday,
        },

        totals: {
          matches: totalMatches,
          messages: totalMessages,
          swipes: totalSwipes,
        },

        matchRate,

        distribution: {
          gender: genderDistribution,
        },
      },
    });
  } catch (err) {
    console.error("GET /stats error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;