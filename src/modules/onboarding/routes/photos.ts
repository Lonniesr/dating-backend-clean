import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.post("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { photos } = req.body;

    // Validate input
    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: "Photos must be an array" });
    }

    if (photos.length === 0) {
      return res.status(400).json({ error: "At least one photo is required" });
    }

    // Optional: ensure all items are strings
    const allStrings = photos.every((p) => typeof p === "string");
    if (!allStrings) {
      return res.status(400).json({ error: "All photos must be string URLs" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        photos: {
          set: photos, // safer for array fields
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        photos: true,
        onboardingComplete: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("ONBOARDING /photos ERROR:", err);
    return res.status(500).json({ error: "Failed to update photos" });
  }
});

export default router;