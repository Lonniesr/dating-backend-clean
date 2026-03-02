import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { env } from "../config/env";

interface JwtPayload {
  sub?: string;
  id?: string;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId =
      typeof payload.sub === "string" ? payload.sub : payload.id;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // 🔥 Fetch FULL user (not partial select)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Attach full user object
    (req as any).user = user;

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}