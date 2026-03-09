import { Request, Response } from "express";
import prisma from "../../../prisma";

type PhotosBody = {
  userId: string;
  photos: string[];
};

export async function savePhotos(req: Request, res: Response) {
  try {
    const { userId, photos } = req.body as PhotosBody;

    if (!userId || !Array.isArray(photos)) {
      return res.status(400).json({
        success: false,
        message: "Missing fields.",
      });
    }

    // delete existing photos
    await prisma.photo.deleteMany({
      where: { userId },
    });

    // recreate photos
    await prisma.photo.createMany({
      data: photos.map((url: string, index: number) => ({
        url,
        order: index,
        userId,
      })),
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("savePhotos error:", err);

    return res.status(500).json({
      success: false,
    });
  }
}