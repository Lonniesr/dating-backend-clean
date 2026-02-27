import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * Update user theme preference
 * Example body: { theme: "dark" }
 */
router.put("/", requireUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({ error: "Theme is required" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { theme },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("UPDATE THEME ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;