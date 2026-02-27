import { Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

export default async function updateProfile(req: Request, res: Response) {
  try {
    // ✅ Ensure user exists (Type-safe guard)
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const {
      name,
      username,
      birthdate,
      gender,
      bio,
      birthplace,
      location,
    } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        username,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        gender,
        bio,
        birthplace,
        location,
      },
    });

    return res.json({ user: updated });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}