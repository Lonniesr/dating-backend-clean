import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * POST /api/onboarding/photos
 * Saves user photo URLs
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { photos } = req.body;

    /* ==============================
       VALIDATION
    ============================== */

    if (!Array.isArray(photos)) {
      return res.status(400).json({
        error: "Photos must be an array",
      });
    }

    if (photos.length === 0) {
      return res.status(400).json({
        error: "At least one photo is required",
      });
    }

    if (photos.length > 6) {
      return res.status(400).json({
        error: "Maximum of 6 photos allowed",
      });
    }

    const cleanedPhotos = photos.map((p: any) =>
      typeof p === "string" ? p.trim() : ""
    );

    const validPhotos = cleanedPhotos.every(
      (url) => typeof url === "string" && url.startsWith("http")
    );

    if (!validPhotos) {
      return res.status(400).json({
        error: "All photos must be valid URLs",
      });
    }

    /* ==============================
       SAVE PHOTOS
    ============================== */

    // delete existing photos
    await prisma.photo.deleteMany({
      where: { userId },
    });

    // create new photos
    await prisma.photo.createMany({
      data: cleanedPhotos.map((url: string, index: number) => ({
        userId,
        url,
        order: index,
      })),
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: {
          orderBy: { order: "asc" },
        },
      },
    });

    return res.json({
      success: true,
      user: updatedUser,
    });

  } catch (err) {
    console.error("ONBOARDING /photos ERROR:", err);

    return res.status(500).json({
      error: "Failed to update photos",
    });
  }
});

export default router;