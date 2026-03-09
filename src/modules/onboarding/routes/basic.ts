import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      name,
      birthdate,
      gender,
      race,
      birthplace,
      location,
    } = req.body;

    // ----- Validation -----

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

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
        birthdate: parsedBirthdate,
        gender,
        race,

        // newly supported fields
        birthplace: birthplace ? birthplace.trim() : null,
        location: location ? location.trim() : null,
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