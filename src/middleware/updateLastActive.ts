import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

/**
 * Updates user's last active timestamp
 * This middleware MUST never break requests.
 */
export async function updateLastActive(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;

    // If user isn't authenticated yet, skip
    if (!user?.id) {
      return next();
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
      },
    });

    next();
  } catch (err) {
    console.error("⚠️ updateLastActive failed:", err);

    // Never block the request if activity update fails
    next();
  }
}