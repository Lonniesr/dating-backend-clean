import { Router } from "express";
import { requireAdmin } from "../../../middleware/requireAdmin";
import prisma from "../../../prisma";

const router = Router();

/**
 * GET /api/admin/bans
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const bannedUsers = await prisma.user.findMany({
      where: { banned: true },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users: bannedUsers });
  } catch (err) {
    console.error("ADMIN BANS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;