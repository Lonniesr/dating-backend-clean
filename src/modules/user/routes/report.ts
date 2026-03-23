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
   REPORT USER
========================= */
router.post(
  "/",
  requireUser,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { targetId, reason, description } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!targetId || !reason) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await prisma.report.create({
        data: {
          reporterId: userId,
          reportedId: targetId,
          reason,
          description,
        },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("REPORT ERROR:", err);

      return res.status(500).json({
        error: "Failed to report user",
      });
    }
  }
);

export default router;