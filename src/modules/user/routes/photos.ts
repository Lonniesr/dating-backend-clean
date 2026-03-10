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
    const { url } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid photo URL" });
    }

    const count = await prisma.photo.count({
      where: { userId },
    });

    await prisma.photo.create({
      data: {
        userId,
        url,
        order: count,
      },
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
    console.error("PHOTO UPLOAD ERROR:", err);

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

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const photo = await prisma.photo.findFirst({
      where: {
        userId,
        order: index,
      },
    });

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
    console.error("DELETE PHOTO ERROR:", err);

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
    console.error("REORDER PHOTO ERROR:", err);

    res.status(500).json({
      error: "Failed to reorder photos",
    });
  }
});

export default router;