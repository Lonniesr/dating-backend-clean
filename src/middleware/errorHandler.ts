import { Request, Response, NextFunction } from "express";

/**
 * Global error handler.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).requestId;

  console.error(`[${requestId}] ERROR:`, err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    requestId,
  });
}