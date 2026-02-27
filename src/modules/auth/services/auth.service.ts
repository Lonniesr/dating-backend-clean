import { Request } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma";
interface JwtPayload {
  userId: string;
  role?: string;
}

export async function getCurrentUser(req: Request) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    return user;
  } catch {
    return null;
  }
}

export async function requireAdmin(req: Request) {
  const user = await getCurrentUser(req);

  if (!user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  if (user.role !== "superadmin") {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user };
}