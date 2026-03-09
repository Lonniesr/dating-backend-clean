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
      birthdate,
      gender,
      race,
      bio,
      birthplace,
      latitude,
      longitude,
    } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!name || !birthdate || !gender || !race) {
      return res.status(400).json({
        message: "Name, birthdate, gender, and race are required.",
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
        message: "Invalid race value.",
      });
    }

    const parsedBirthdate = new Date(birthdate);

    if (isNaN(parsedBirthdate.getTime())) {
      return res.status(400).json({
        message: "Invalid birthdate format.",
      });
    }

    /* =========================
       UPDATE USER
    ========================= */

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        birthdate: parsedBirthdate,
        gender,
        race,

        bio: bio ? bio.trim() : null,
        birthplace: birthplace ? birthplace.trim() : null,

        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    return res.status(200).json({
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