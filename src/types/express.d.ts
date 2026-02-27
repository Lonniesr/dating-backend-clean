import type { PrismaClient } from "@prisma/client";
import { AuthUser } from "./auth";

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