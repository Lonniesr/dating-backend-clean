import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
  };
};

/* =========================
   BLOCK USER
========================= */
router.post(
  "/",
  requireUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { targetId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!targetId) {
        return res.status(400).json({ error: "Missing targetId" });
      }

      await prisma.block.create({
        data: {
          blockerId: userId,
          blockedId: targetId,
        },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("BLOCK ERROR:", err);

      return res.status(500).json({
        error: "Failed to block user",
      });
    }
  }
);

export default router;