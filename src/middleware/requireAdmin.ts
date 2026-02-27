import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { env } from "../config/env";

interface AdminJwtPayload {
  sub?: string;
  id?: string;
  role?: string;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    let payload: AdminJwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const adminId = typeof payload.sub === "string" ? payload.sub : payload.id;

    if (!adminId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(401).json({ error: "Admin not found" });
    }

    // Attach admin to request for downstream use
    (req as any).admin = admin;

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}