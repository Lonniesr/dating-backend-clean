import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma";
import { env } from "../../../config/env";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      invite,
      inviteCode,
    } = req.body as {
      email?: string;
      password?: string;
      invite?: string;
      inviteCode?: string;
    };

    const inviteValue = invite || inviteCode;

    /* =========================
       VALIDATION
    ========================= */

    if (!email || !password || !inviteValue) {
      return res.status(400).json({
        message: "Missing required fields.",
      });
    }

    const inviteRecord = await prisma.invite.findUnique({
      where: { code: inviteValue },
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered.",
      });
    }

    /* =========================
       CREATE USER
    ========================= */

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        onboardingComplete: false,
        role: "user",
        inviteCode: inviteRecord.code,
      },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingComplete: true,
      },
    });

    /* =========================
       UPDATE INVITE ANALYTICS
    ========================= */

    await prisma.invite.update({
      where: { id: inviteRecord.id },
      data: {
        used: true,
        usedAt: new Date(),
        usedById: user.id,
        signupCount: { increment: 1 },
      },
    });

    /* =========================
       ISSUE JWT
    ========================= */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    /* =========================
       COOKIE CONFIG
    ========================= */

    const isProduction = env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;