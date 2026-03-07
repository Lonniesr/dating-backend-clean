import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

type SwipeDirection = "left" | "right" | "super";

interface SwipeBody {
  direction: SwipeDirection;
}

router.post(
  "/:id",
  requireUser,
  async (req: Request<{ id: string }, {}, SwipeBody> & { user?: any }, res: Response) => {
    try {
      const swiperId = req.user?.id;
      const targetId = req.params.id;
      const { direction } = req.body;

      if (!swiperId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!["left", "right", "super"].includes(direction)) {
        return res.status(400).json({ message: "Invalid swipe direction" });
      }

      // ---------------- SUPER LIKE LOGIC ----------------

      if (direction === "super") {
        const user = await prisma.user.findUnique({
          where: { id: swiperId },
        });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const now = new Date();

        let remaining = user.superLikesRemaining;
        let resetAt = user.superLikesResetAt;

        if (!resetAt || now > resetAt) {
          remaining = 3;
          resetAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          await prisma.user.update({
            where: { id: swiperId },
            data: {
              superLikesRemaining: remaining,
              superLikesResetAt: resetAt,
            },
          });
        }

        if (remaining <= 0) {
          return res.status(400).json({
            message: "No Super Likes remaining",
          });
        }

        await prisma.user.update({
          where: { id: swiperId },
          data: {
            superLikesRemaining: remaining - 1,
          },
        });
      }

      // ---------------- CREATE SWIPE ----------------

      await prisma.swipe.create({
        data: {
          swiperId,
          targetId,
          direction,
        },
      });

      // ---------------- MATCH CHECK ----------------

      if (direction !== "left") {
        const reciprocal = await prisma.swipe.findFirst({
          where: {
            swiperId: targetId,
            targetId: swiperId,
            direction: {
              in: ["right", "super"],
            },
          },
        });

        if (reciprocal) {
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
      }

      return res.json({ match: false });

    } catch (err) {
      console.error("SWIPE ERROR:", err);
      return res.status(500).json({ message: "Failed to process swipe." });
    }
  }
);

export default router;