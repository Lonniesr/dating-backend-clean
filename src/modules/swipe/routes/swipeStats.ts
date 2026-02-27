import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.get("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const totalSwipes = await prisma.swipe.count({
      where: { swiperId: userId }
    });

    const likesGiven = await prisma.swipe.count({
      where: { swiperId: userId, direction: "like" }
    });

    const likesReceived = await prisma.swipe.count({
      where: { targetId: userId, direction: "like" }
    });

    const matches = await prisma.match.count({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      }
    });

    const last7Days = await prisma.swipe.groupBy({
      by: ["createdAt"],
      where: {
        swiperId: userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: true
    });

    return res.json({
      totalSwipes,
      likesGiven,
      likesReceived,
      matches,
      activity: last7Days
    });

  } catch (err) {
    console.error("SWIPE STATS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;