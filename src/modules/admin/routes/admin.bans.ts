import { Router } from "express";
import { requireAdmin } from "../../../middleware/requireAdmin";
import prisma from "../../../prisma";

const router = Router();

/**
 * GET /api/admin/bans
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { banned: true },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (err) {
    console.error("ADMIN BANS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/admin/bans/:userId
 */
router.post("/:userId", requireAdmin, async (req, res) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam)
      ? userIdParam[0]
      : userIdParam;

    if (!userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "admin",
        content: "Your account has been banned.",
      },
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("BAN USER ERROR:", err);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

/**
 * DELETE /api/admin/bans/:userId
 */
router.delete("/:userId", requireAdmin, async (req, res) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam)
      ? userIdParam[0]
      : userIdParam;

    if (!userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "admin",
        content: "Your account has been unbanned.",
      },
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("UNBAN USER ERROR:", err);
    res.status(500).json({ error: "Failed to unban user" });
  }
});

export default router;