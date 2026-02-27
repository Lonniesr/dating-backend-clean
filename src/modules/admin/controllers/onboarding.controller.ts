import { Request, Response } from "express";
import prisma from "../../../prisma";
interface BasicInfoBody {
  userId: string;
  name: string;
  birthdate: string;
  gender: string;
}

interface PhotosBody {
  userId: string;
  photos: string[];
}

interface PreferencesBody {
  userId: string;
  preferences: any; // tighten later if you have a type
}

interface PersonalityBody {
  userId: string;
  prompts: any[]; // tighten later if you have a type
}

interface CompleteOnboardingBody {
  userId: string;
}

export async function saveBasicInfo(req: Request, res: Response) {
  try {
    const { userId, name, birthdate, gender } =
      req.body as BasicInfoBody;

    if (!userId || !name || !birthdate || !gender) {
      return res.status(400).json({
        success: false,
        message: "Missing fields.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        birthdate: new Date(birthdate),
        gender,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("saveBasicInfo error:", err);
    return res.status(500).json({ success: false });
  }
}

export async function savePhotos(req: Request, res: Response) {
  try {
    const { userId, photos } = req.body as PhotosBody;

    if (!userId || !Array.isArray(photos)) {
      return res.status(400).json({
        success: false,
        message: "Missing fields.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { photos },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("savePhotos error:", err);
    return res.status(500).json({ success: false });
  }
}

export async function savePreferences(req: Request, res: Response) {
  try {
    const { userId, preferences } =
      req.body as PreferencesBody;

    if (!userId || !preferences) {
      return res.status(400).json({
        success: false,
        message: "Missing fields.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { preferences },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("savePreferences error:", err);
    return res.status(500).json({ success: false });
  }
}

export async function savePersonality(req: Request, res: Response) {
  try {
    const { userId, prompts } =
      req.body as PersonalityBody;

    if (!userId || !Array.isArray(prompts)) {
      return res.status(400).json({
        success: false,
        message: "Missing fields.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { prompts },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("savePersonality error:", err);
    return res.status(500).json({ success: false });
  }
}

export async function completeOnboarding(
  req: Request,
  res: Response
) {
  try {
    const { userId } = req.body as CompleteOnboardingBody;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId.",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("completeOnboarding error:", err);
    return res.status(500).json({ success: false });
  }
}