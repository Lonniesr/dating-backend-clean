import { Router, Request, Response } from "express";
import { env } from "../../config/env";

const router = Router();

router.post("/", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.json({ ok: true });
});

export default router;