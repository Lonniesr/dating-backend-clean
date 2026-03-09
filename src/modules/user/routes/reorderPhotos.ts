import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function reorderPhotos(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { newOrder } = req.body;

    if (!Array.isArray(newOrder)) {
      return res.status(400).json({ error: "Invalid photo order" });
    }

    await Promise.all(
      newOrder.map((photoId: string, index: number) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { order: index },
        })
      )
    );

    const photos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { url: true },
    });

    return res.json({
      photos: photos.map((p) => p.url),
    });
  } catch (err) {
    console.error("REORDER PHOTO ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}