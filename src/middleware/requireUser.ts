import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../prisma";
import { env } from "./../config/env";

/* =========================
   AUTH USER TYPE
========================= */

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  onboardingComplete: boolean;
  name: string | null;
  gender: string | null;
  preferences: any | null;
}

/* =========================
   EXPRESS REQUEST AUGMENTATION
========================= */

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/* =========================
   TOKEN EXTRACTION
========================= */

function getToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieToken = req.cookies?.token;

  if (typeof cookieToken === "string") {
    return cookieToken;
  }

  return undefined;
}

/* =========================
   JWT PAYLOAD EXTRACTION
========================= */

function getUserIdFromPayload(
  payload: string | JwtPayload
): string | undefined {
  if (typeof payload === "string") return undefined;

  if (typeof payload.sub === "string" && payload.sub) {
    return payload.sub;
  }

  const maybeId = (payload as any).id;
  if (typeof maybeId === "string" && maybeId) {
    return maybeId;
  }

  return undefined;
}

/* =========================
   REQUIRE USER MIDDLEWARE
========================= */

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
    const userId = getUserIdFromPayload(decoded);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
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

    /* =========================
       ONBOARDING GUARD
    ========================== */

    const isOnboardingRoute = req.originalUrl.startsWith("/api/onboarding");

    if (!user.onboardingComplete && !isOnboardingRoute) {
      res.status(403).json({
        error: "Onboarding incomplete",
        onboardingRequired: true,
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}