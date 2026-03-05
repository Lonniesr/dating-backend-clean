import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.get("/test", (req, res) => {
  res.json({ photosRouter: "working" });
});

/**
 * POST /api/user/photos/upload
 */
router.post("/upload", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    let { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Photo URL required" });
    }

    // 🔥 FIX: clean the URL before saving
    url = url
      .replace(/^"+|"+$/g, "") // remove quotes
      .replace(/\\/g, "") // remove escaped slashes
      .trim();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { photos: true },
    });

    const updatedPhotos = [...(user?.photos || []), url];

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        photos: {
          set: updatedPhotos,
        },
      },
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("PHOTO UPLOAD ERROR:", err);
    return res.status(500).json({ error: "Failed to upload photo" });
  }
});

/**
 * DELETE /api/user/photos/:index
 */
router.delete("/:index", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const index = Number(req.params.index);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { photos: true },
    });

    if (!user?.photos) {
      return res.status(400).json({ error: "No photos found" });
    }

    const updatedPhotos = [...user.photos];
    updatedPhotos.splice(index, 1);

    await prisma.user.update({
      where: { id: userId },
      data: {
        photos: {
          set: updatedPhotos,
        },
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("PHOTO DELETE ERROR:", err);
    return res.status(500).json({ error: "Failed to delete photo" });
  }
});

/**
 * PUT /api/user/photos/reorder
 */
router.put("/reorder", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: "Order must be array" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        photos: {
          set: order,
        },
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("PHOTO REORDER ERROR:", err);
    return res.status(500).json({ error: "Failed to reorder photos" });
  }
});

export default router;