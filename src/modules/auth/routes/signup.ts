import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma";
import { env } from "../../../config/env";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { email, password, invite } = req.body as {
    email?: string;
    password?: string;
    invite?: string;
  };

  try {
    if (!email || !password || !invite) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const inviteRecord = await prisma.invite.findUnique({
      where: { code: invite },
    });

    if (!inviteRecord) {
      return res.status(400).json({ reason: "not_found" });
    }

    if (inviteRecord.used) {
      return res.status(400).json({ reason: "used" });
    }

    if (inviteRecord.expiresAt && inviteRecord.expiresAt < new Date()) {
      return res.status(400).json({ reason: "expired" });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        onboardingComplete: false,
        role: "user", // default role
      },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingComplete: true,
      },
    });

    await prisma.invite.update({
      where: { id: inviteRecord.id },
      data: {
        used: true,
        usedAt: new Date(),
        usedById: user.id,
      },
    });

    // ✅ STANDARDIZED JWT STRUCTURE
    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;