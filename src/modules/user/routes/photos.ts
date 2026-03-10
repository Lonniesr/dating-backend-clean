import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/user/photos/upload
 * Save photo URL to DB
 */
router.post("/upload", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    console.log("📸 PHOTO UPLOAD HIT");
    console.log("📸 USER ID:", userId);
    console.log("📸 BODY:", req.body);

    const { url } = req.body || {};

    if (!userId) {
      console.log("❌ Upload failed: no user ID");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!url || typeof url !== "string") {
      console.log("❌ Upload failed: invalid URL", url);
      return res.status(400).json({ error: "Invalid photo URL" });
    }

    const count = await prisma.photo.count({
      where: { userId },
    });

    console.log("📸 Existing photo count:", count);

    await prisma.photo.create({
      data: {
        userId,
        url,
        order: count,
      },
    });

    console.log("✅ Photo saved:", url);

    const photos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { url: true },
    });

    console.log("📸 Returning photos:", photos);

    res.json({
      success: true,
      photos: photos.map((p) => p.url),
    });
  } catch (err) {
    console.error("🔥 PHOTO UPLOAD ERROR:", err);

    res.status(500).json({
      error: "Failed to upload photo",
    });
  }
});

/**
 * DELETE /api/user/photos/:index
 */
router.delete("/:index", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const index = Number(req.params.index);

    console.log("🗑 DELETE PHOTO");
    console.log("USER:", userId);
    console.log("INDEX:", index);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const photo = await prisma.photo.findFirst({
      where: {
        userId,
        order: index,
      },
    });

    console.log("PHOTO FOUND:", photo);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    await prisma.photo.delete({
      where: { id: photo.id },
    });

    const photos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { url: true },
    });

    res.json({
      success: true,
      photos: photos.map((p) => p.url),
    });
  } catch (err) {
    console.error("🔥 DELETE PHOTO ERROR:", err);

    res.status(500).json({
      error: "Failed to delete photo",
    });
  }
});

/**
 * PUT /api/user/photos/reorder
 */
router.put("/reorder", requireUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { order } = req.body;

    console.log("🔄 REORDER PHOTOS");
    console.log("USER:", userId);
    console.log("NEW ORDER:", order);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    for (let i = 0; i < order.length; i++) {
      await prisma.photo.updateMany({
        where: {
          userId,
          url: order[i],
        },
        data: {
          order: i,
        },
      });
    }

    const photos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { url: true },
    });

    res.json({
      success: true,
      photos: photos.map((p) => p.url),
    });
  } catch (err) {
    console.error("🔥 REORDER PHOTO ERROR:", err);

    res.status(500).json({
      error: "Failed to reorder photos",
    });
  }
});

export default router;