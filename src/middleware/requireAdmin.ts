import { Request, Response, NextFunction } from "express";
import { requireUser } from "./requireUser";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  await requireUser(req, res, async () => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  });
}