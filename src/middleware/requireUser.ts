import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../prisma";
import { env } from "../config/env";

export interface AuthUser {
  id: string;
  email: string;
  onboardingComplete: boolean;
  name: string | null;
  gender: string | null;
  preferences: any | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.split(" ")[1];
  if (req.cookies?.token) return req.cookies.token;
  return undefined;
}

function getUserIdFromPayload(payload: string | JwtPayload): string | undefined {
  if (typeof payload === "string") return undefined;

  // Prefer JWT "sub" if present
  if (typeof payload.sub === "string" && payload.sub) return payload.sub;

  // Support legacy payloads like { id: "..." }
  const maybeId = (payload as any).id;
  if (typeof maybeId === "string" && maybeId) return maybeId;

  return undefined;
}

export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getToken(req);

    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = getUserIdFromPayload(decoded as any);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        onboardingComplete: true,
        name: true,
        gender: true,
        preferences: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}