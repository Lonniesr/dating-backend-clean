import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function getMatches(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            photos: true,
            gender: true
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            photos: true,
            gender: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = matches.map((m: typeof matches[number]) => {
      const other =
        m.userAId === userId ? m.userB : m.userA;

      const photos = Array.isArray(other.photos)
        ? other.photos.map((p: any) =>
            typeof p === "string" ? p : p?.url
          ).filter(Boolean)
        : [];

      return {
        id: other.id,
        name: other.name,
        gender: other.gender,
        photos
      };
    });

    return res.json(formatted);

  } catch (err) {
    console.error("GET MATCHES ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}