import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/swipe/:id
 * Swipe left or right on a user
 */
router.post(
  "/:id",
  requireUser,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const swiperId = req.user?.id;
      const targetId = req.params.id;
      const { direction } = req.body;

      if (!swiperId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!targetId || typeof targetId !== "string") {
        return res.status(400).json({ message: "Invalid target user" });
      }

      if (swiperId === targetId) {
        return res.status(400).json({ message: "Cannot swipe yourself" });
      }

      if (!["left", "right"].includes(direction)) {
        return res.status(400).json({ message: "Invalid swipe direction" });
      }

      // Prevent duplicate swipes
      const existingSwipe = await prisma.swipe.findFirst({
        where: {
          swiperId,
          targetId,
        },
      });

      if (existingSwipe) {
        return res.json({ match: false, alreadySwiped: true });
      }

      // Save swipe
      await prisma.swipe.create({
        data: {
          swiperId,
          targetId,
          direction,
        },
      });

      // Only check matches on right swipe
      if (direction === "right") {
        const reciprocalSwipe = await prisma.swipe.findFirst({
          where: {
            swiperId: targetId,
            targetId: swiperId,
            direction: "right",
          },
        });

        if (reciprocalSwipe) {
          // Prevent duplicate matches
          const existingMatch = await prisma.match.findFirst({
            where: {
              OR: [
                { userAId: swiperId, userBId: targetId },
                { userAId: targetId, userBId: swiperId },
              ],
            },
          });

          if (!existingMatch) {
            const match = await prisma.match.create({
              data: {
                userAId: swiperId,
                userBId: targetId,
              },
            });

            return res.json({
              match: true,
              matchData: match,
            });
          }

          return res.json({
            match: true,
            matchData: existingMatch,
          });
        }
      }

      return res.json({ match: false });
    } catch (err) {
      console.error("SWIPE ERROR:", err);

      return res.status(500).json({
        message: "Failed to process swipe.",
      });
    }
  }
);

export default router;