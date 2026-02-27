import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function reorderPhotos(req: Request, res: Response) {
  try {
    // ✅ Type-safe auth guard
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { newOrder } = req.body;

    if (!Array.isArray(newOrder)) {
      return res.status(400).json({ error: "Invalid photo order" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { photos: newOrder },
      select: { photos: true },
    });

    return res.json({ photos: updated.photos });
  } catch (err) {
    console.error("REORDER PHOTO ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}