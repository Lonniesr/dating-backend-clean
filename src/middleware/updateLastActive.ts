import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

export async function updateLastActive(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          lastActiveAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("lastActive update failed", err);
  }

  next();
}