import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../../prisma";
const router = Router();

/**
 * Simple auth middleware
 * Assumes some earlier middleware attaches user to req
 */
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * GET /api/user/matches
 * Returns all matches for the authenticated user
 */
router.get("/user/matches", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userAId: user.id },
          { userBId: user.id }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        userA: true,
        userB: true
      }
    });

    return res.json(matches);
  } catch (err) {
    console.error("MATCH LIST ERROR:", err);
    return res.status(500).json({ error: "Failed to load matches" });
  }
});

export default router;