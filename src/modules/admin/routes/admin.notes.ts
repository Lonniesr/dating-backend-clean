import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/notes
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ notes });
  } catch (err) {
    console.error("ADMIN NOTES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;