import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/roles
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const roles = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    res.json({ roles });
  } catch (err) {
    console.error("ADMIN ROLES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/admin/roles/users?role=admin
 */
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const role = req.query.role as string;

    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (err) {
    console.error("ADMIN ROLE USERS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/admin/roles/assign
 */
router.post("/assign", requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    res.json({ user });
  } catch (err) {
    console.error("ADMIN ROLE ASSIGN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;