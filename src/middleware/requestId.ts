import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

/**
 * Attaches a unique requestId to every incoming request.
 * Useful for correlating logs, debugging, and tracing.
 */
export function requestId(req: Request, _res: Response, next: NextFunction) {
  const id = randomUUID();

  // Attach to request object
  (req as any).requestId = id;

  // Also attach to headers for downstream services
  req.headers["x-request-id"] = id;

  next();
}