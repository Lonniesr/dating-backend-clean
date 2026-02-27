import { Request, Response, NextFunction } from "express";

/**
 * Logs method, path, status, duration, and requestId.
 */
export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req as any).requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}