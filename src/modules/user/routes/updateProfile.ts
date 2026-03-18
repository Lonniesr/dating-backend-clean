import { Request, Response } from "express";
import prisma from "../../../prisma";

export default async function updateProfile(
  req: Request & { user?: any },
  res: Response
) {
  try {
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
      preferences,
      prompts,
    } = req.body;

    console.log("📥 UPDATE PAYLOAD:", req.body);

    /* ===============================
       BUILD SAFE UPDATE OBJECT
    =============================== */

    const data: any = {};

    if (typeof name === "string") data.name = name.trim();
    if (typeof username === "string") data.username = username.trim();

    if (birthdate) {
      const parsed = new Date(birthdate);
      if (!isNaN(parsed.getTime())) {
        data.birthdate = parsed;
      }
    }

    if (typeof gender === "string") data.gender = gender;

    if (typeof bio === "string") {
      data.bio = bio.trim() || null;
    }

    if (typeof birthplace === "string") {
      data.birthplace = birthplace.trim() || null;
    }

    if (typeof location === "string") {
      data.location = location.trim() || null;
    }

    /* ===============================
       🔥 HANDLE PREFERENCES
    =============================== */

    if (preferences && typeof preferences === "object") {
      data.preferences = {
        interestedIn: preferences.interestedIn || null,
        racePreference: preferences.racePreference || null,
        minAge: Number(preferences.minAge) || 18,
        maxAge: Number(preferences.maxAge) || 40,
        locationRadius:
          preferences.locationRadius === null
            ? null
            : Number(preferences.locationRadius) || 50,
      };
    }

    /* ===============================
       🔥 HANDLE PROMPTS
    =============================== */

    if (Array.isArray(prompts)) {
      data.prompts = prompts;
    }

    console.log("🛠️ UPDATE DATA:", data);

    /* ===============================
       UPDATE USER
    =============================== */

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        birthdate: true,
        gender: true,
        bio: true,
        birthplace: true,
        location: true,
        preferences: true,
        prompts: true,
        photos: true,
      },
    });

    console.log("✅ PROFILE UPDATED");

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ UPDATE PROFILE ERROR:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
}