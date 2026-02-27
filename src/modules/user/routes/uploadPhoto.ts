import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function uploadPhoto(req: Request, res: Response) {
  try {
    // ✅ Type-safe auth guard
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = `/uploads/photos/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        photos: {
          push: filePath,
        },
      },
      select: {
        photos: true,
      },
    });

    return res.json({ photos: updated.photos });
  } catch (err) {
    console.error("UPLOAD PHOTO ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}