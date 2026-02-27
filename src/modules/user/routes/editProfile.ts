import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function editProfile(req: Request, res: Response) {
  try {
    // ✅ Ensure user exists (Type-safe + runtime safe)
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        prompts: true,
        photos: true,
        birthdate: true,
        gender: true,
        location: true,
        birthplace: true,
      },
    });

    return res.json({ user });
  } catch (err) {
    console.error("EDIT PROFILE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}