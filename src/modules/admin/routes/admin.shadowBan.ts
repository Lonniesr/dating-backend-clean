import { Router } from "express";
import { requireAdmin } from "../../../middleware/requireAdmin";
import prisma from "../../../prisma";

const router = Router();

/**
 * GET /api/admin/shadow-ban
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        shadowBanned: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        shadowBanned: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ users });
  } catch (err) {
    console.error("ADMIN SHADOW BAN ERROR:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/**
 * POST /api/admin/shadow-ban/:userId
 */
router.post("/:userId", requireAdmin, async (req, res) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam)
      ? userIdParam[0]
      : userIdParam;

    if (!userId) {
      return res.status(400).json({
        error: "Invalid userId",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        shadowBanned: true,
      },
    });

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("SHADOW BAN ERROR:", err);

    return res.status(500).json({
      error: "Failed to shadow ban user",
    });
  }
});

/**
 * DELETE /api/admin/shadow-ban/:userId
 */
router.delete("/:userId", requireAdmin, async (req, res) => {
  try {
    const userIdParam = req.params.userId;
    const userId = Array.isArray(userIdParam)
      ? userIdParam[0]
      : userIdParam;

    if (!userId) {
      return res.status(400).json({
        error: "Invalid userId",
      });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        shadowBanned: false,
      },
    });

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("REMOVE SHADOW BAN ERROR:", err);

    return res.status(500).json({
      error: "Failed to remove shadow ban",
    });
  }
});

export default router;