import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env";

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "x-csrf-token";

export function csrfTokenSetter(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");

    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
  }

  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
}