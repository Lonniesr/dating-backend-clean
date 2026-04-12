import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.post("/", requireUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      username,
      birthdate,
      gender,
      race,
      bio,
      location,      // ✅ NEW (replaces birthplace)
      latitude,
      longitude,
    } = req.body;

    /* =========================
       NORMALIZE NAME
    ========================= */

    const finalName = (name || username || "").trim();

    /* =========================
       VALIDATION
    ========================= */

    if (!finalName || !birthdate || !gender || !race) {
      return res.status(400).json({
        error: "Name, birthdate, gender, and race are required.",
      });
    }

    // ✅ LOCATION REQUIRED
    if (!location || !location.trim()) {
      return res.status(400).json({
        error: "Location is required.",
      });
    }

    // ✅ COORDINATES REQUIRED
    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null
    ) {
      return res.status(400).json({
        error: "Valid location coordinates required.",
      });
    }

    const validRaces = [
      "Black",
      "White",
      "Asian",
      "Latino",
      "Middle Eastern",
      "Mixed",
      "Other",
    ];

    if (!validRaces.includes(race)) {
      return res.status(400).json({
        error: "Invalid race value.",
      });
    }

    const parsedBirthdate = new Date(birthdate);

    if (isNaN(parsedBirthdate.getTime())) {
      return res.status(400).json({
        error: "Invalid birthdate format.",
      });
    }

    /* =========================
       AGE CALCULATION
    ========================= */

    const today = new Date();
    let age = today.getFullYear() - parsedBirthdate.getFullYear();
    const m = today.getMonth() - parsedBirthdate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < parsedBirthdate.getDate())) {
      age--;
    }

    /* =========================
       UPDATE USER
    ========================= */

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: finalName,
        birthdate: parsedBirthdate,
        age,
        gender,
        race,
        location: location.trim(), // ✅ SAVED PROPERLY

        ...(bio !== undefined && { bio: bio?.trim() || null }),

        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      select: {
        id: true,
        name: true,
        birthdate: true,
        age: true,
        gender: true,
        race: true,
        bio: true,
        location: true,   // ✅ RETURNED
        latitude: true,
        longitude: true,
      },
    });

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error("ONBOARDING BASIC ERROR:", error);

    return res.status(500).json({
      error: "Failed to update basic info",
    });
  }
});

export default router;