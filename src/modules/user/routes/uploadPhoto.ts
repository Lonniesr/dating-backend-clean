import { Request, Response } from "express";
import prisma from "../../../prisma";

/**
 * POST /api/user/photos/upload
 * Save photo URL after it has already been uploaded to storage
 */
export default async function uploadPhoto(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Invalid photo URL" });
    }

    /**
     * Get current photo count to determine order
     */
    const count = await prisma.photo.count({
      where: { userId },
    });

    /**
     * Save photo record
     */
    await prisma.photo.create({
      data: {
        userId,
        url,
        order: count,
      },
    });

    /**
     * Return updated photo list
     */
    const photos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { url: true },
    });

    return res.json({
      success: true,
      photos: photos.map((p) => p.url),
    });
  } catch (err) {
    console.error("UPLOAD PHOTO ERROR:", err);

    return res.status(500).json({
      error: "Failed to save photo",
    });
  }
}