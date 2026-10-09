import { Router, Request, Response } from "express";
import prisma from "../../../prisma";

const router = Router();

/* =========================
   PUBLIC ACTIVITY STATUS
========================= */

/**
 * Returns whether at least one LynQ user
 * has been active within the last 15 minutes.
 *
 * PUBLIC ROUTE:
 * Used by the home/login page before authentication.
 *
 * Does NOT expose:
 * - user count
 * - user IDs
 * - names
 * - profiles
 * - locations
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const fifteenMinutesAgo = new Date(
      Date.now() - 15 * 60 * 1000
    );

    const activeUser = await prisma.user.findFirst({
      where: {
        lastActiveAt: {
          gte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
      },
    });

    return res.status(200).json({
      active: Boolean(activeUser),
    });
  } catch (error) {
    console.error("PUBLIC ACTIVITY STATUS ERROR:", error);

    /*
     * Fail closed.
     * If the database check fails, the frontend simply
     * won't display the activity indicator.
     */
    return res.status(200).json({
      active: false,
    });
  }
});

export default router;