import { Request, Response, NextFunction } from "express";
import helmet from "helmet";

/**
 * Apply Helmet security headers.
 * Exported as a NAMED function (not default).
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  return helmet()(req, res, next);
}
