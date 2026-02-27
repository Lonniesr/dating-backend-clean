import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

const allowedAdminOrigins = (env.ADMIN_CORS_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

export function adminCorsGuard(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (!origin) return next();

  if (!allowedAdminOrigins.includes(origin)) {
    return res.status(403).json({ error: "Admin origin not allowed" });
  }

  next();
}