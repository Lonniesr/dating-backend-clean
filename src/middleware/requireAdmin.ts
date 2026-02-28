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
    // 🔐 Read token from httpOnly cookie
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

    // Extract user id from JWT
    const userId =
      typeof payload.sub === "string" ? payload.sub : payload.id;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // 🔎 Database is source of truth
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Attach admin user to request
    (req as any).admin = user;

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}