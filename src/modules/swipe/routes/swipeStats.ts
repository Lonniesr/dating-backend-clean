import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
import { subDays, startOfDay } from "date-fns";

const router = Router();

/**
 * GET /api/swipe/stats
 * Returns swipe statistics for the logged-in user
 */
router.get("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const weekAgo = startOfDay(subDays(new Date(), 6));

    // -------- TOTAL SWIPES --------
    const totalSwipes = await prisma.swipe.count({
      where: { swiperId: userId },
    });

    // -------- LIKES GIVEN --------
    const likesGiven = await prisma.swipe.count({
      where: {
        swiperId: userId,
        direction: "right",
      },
    });

    // -------- LIKES RECEIVED --------
    const likesReceived = await prisma.swipe.count({
      where: {
        targetId: userId,
        direction: "right",
      },
    });

    // -------- MATCH COUNT --------
    const matches = await prisma.match.count({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    // -------- SWIPES LAST 7 DAYS --------
    const swipes = await prisma.swipe.findMany({
      where: {
        swiperId: userId,
        createdAt: { gte: weekAgo },
      },
      select: { createdAt: true },
    });

    // Convert to daily buckets
    const activityMap: Record<string, number> = {};

    swipes.forEach((s) => {
      const day = startOfDay(s.createdAt).toISOString();

      if (!activityMap[day]) {
        activityMap[day] = 0;
      }

      activityMap[day]++;
    });

    const activity = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
    }));

    return res.json({
      success: true,
      stats: {
        totalSwipes,
        likesGiven,
        likesReceived,
        matches,
        activity,
      },
    });
  } catch (err) {
    console.error("SWIPE STATS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;