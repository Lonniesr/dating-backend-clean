import type { PrismaClient } from "@prisma/client";
import { AuthUser } from "../middleware/requireUser"; // ✅ FIXED PATH

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      prisma?: PrismaClient;
      requestId?: string;
    }
  }
}

export {};