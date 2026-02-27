import { Router, Request, Response } from "express";
import prisma from "../../../prisma";                 // ✅ FIXED
import { requireUser } from "../../../middleware/requireUser"; // ✅ FIXED

const router = Router();

/**
 * GET /api/discover
 * Returns swipe candidates for the logged-in user
 */
router.get("/", requireUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Users this user already swiped on
    const swipes = await prisma.swipe.findMany({
      where: { swiperId: userId },
      select: { targetId: true },
    });
    const swipedIds = swipes.map((s) => s.targetId);

    // Users already matched with this user
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      select: { userAId: true, userBId: true },
    });

    const matchedIds = matches
      .flatMap((m) => [m.userAId, m.userBId])
      .filter((id) => id !== userId);

    // Fetch candidates
    const candidates = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
          notIn: [...swipedIds, ...matchedIds],
        },
        onboardingComplete: true,
        photos: { isEmpty: false },
      },
      select: {
        id: true,
        name: true,
        gender: true,
        photos: true,
        birthdate: true,
        location: true,
      },
      take: 20,
    });

    res.json(candidates);
  } catch (err) {
    console.error("DISCOVER ERROR:", err);
    res.status(500).json({ message: "Failed to load discover feed." });
  }
});

export default router;
