import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/**
 * GET /api/admin/settings
 */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    let settings = await prisma.adminSettings.findUnique({
      where: { id: "admin-settings" },
    });

    // If not created yet, create default row
    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: { id: "admin-settings" },
      });
    }

    res.json({ settings });
  } catch (err) {
    console.error("ADMIN SETTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/admin/settings
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { maintenanceMode, siteName, supportEmail } = req.body;

    const updated = await prisma.adminSettings.upsert({
      where: { id: "admin-settings" },
      update: {
        maintenanceMode,
        siteName,
        supportEmail,
      },
      create: {
        id: "admin-settings",
        maintenanceMode,
        siteName,
        supportEmail,
      },
    });

    res.json({ settings: updated });
  } catch (err) {
    console.error("ADMIN SETTINGS UPDATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;