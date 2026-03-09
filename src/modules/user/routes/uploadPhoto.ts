import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function uploadPhoto(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = `/uploads/photos/${req.file.filename}`;

    const count = await prisma.photo.count({
      where: { userId },
    });

    await prisma.photo.create({
      data: {
        url: filePath,
        order: count,
        userId,
      },
    });

    const photos = await prisma.photo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    });

    return res.json({
      photos: photos.map((p) => p.url),
    });
  } catch (err) {
    console.error("UPLOAD PHOTO ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}