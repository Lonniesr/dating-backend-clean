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
      const targetIdParam = req.params.id;
      const { direction } = req.body;

      if (!swiperId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (typeof targetIdParam !== "string") {
        return res.status(400).json({ message: "Invalid target user" });
      }

      if (!["left", "right"].includes(direction)) {
        return res.status(400).json({ message: "Invalid swipe direction" });
      }

      const targetId = targetIdParam;

      // Record the swipe
      await prisma.swipe.create({
        data: {
          swiperId,
          targetId,
          direction,
        },
      });

      // If right swipe, check for reciprocal right swipe
      if (direction === "right") {
        const reciprocal = await prisma.swipe.findFirst({
          where: {
            swiperId: targetId,
            targetId: swiperId,
            direction: "right",
          },
        });

        if (reciprocal) {
          const match = await prisma.match.create({
            data: {
              userAId: swiperId,
              userBId: targetId,
            },
          });

          return res.json({ match: true, matchData: match });
        }
      }

      return res.json({ match: false });
    } catch (err) {
      console.error("SWIPE ERROR:", err);
      return res.status(500).json({ message: "Failed to process swipe." });
    }
  }
);

export default router;