import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const router = Router();

/**
 * GET /api/invite/:code
 * Public invite validation route
 */
router.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { code },
    });

    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (invite.used) {
      return res.status(400).json({ error: "Invite already used" });
    }

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Invite expired" });
    }

    res.json({
      valid: true,
      code: invite.code,
    });

  } catch (error) {
    console.error("Public invite lookup error:", error);
    res.status(500).json({ error: "Failed to validate invite" });
  }
});

export default router;