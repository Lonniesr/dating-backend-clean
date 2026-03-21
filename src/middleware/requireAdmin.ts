import { Request, Response, NextFunction } from "express";
import { requireUser } from "./requireUser";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await requireUser(req, res, () => {
      // If requireUser already sent a response, stop here
      if (res.headersSent) return;

      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      return next();
    });
  } catch (err) {
    console.error("requireAdmin error:", err);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
}