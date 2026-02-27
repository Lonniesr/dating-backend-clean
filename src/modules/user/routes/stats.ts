import { Router } from "express";
import prisma from "../../../prisma";                 // ✅ FIXED
import { startOfDay, subDays } from "date-fns";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);

    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: { createdAt: { gte: today } },
    });
    const newUsersWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } },
    });

    const totalMatches = await prisma.match.count();
    const totalMessages = await prisma.message.count();
    const totalSwipes = await prisma.swipe.count();

    const genderDistribution =
      (await prisma.user
        .groupBy({
          by: ["gender"],
          _count: { gender: true },
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
        matches: totalMatches,
        messages: totalMessages,
        swipes: totalSwipes,
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

export default router;   // ✅ FIXED
