import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma";
import { env } from "../../../config/env";
import { sendLynqMessage } from "../../../utils/sendLynqMessage";

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

    // 🔥 FIXED: split logic for premium vs normal
    if (!inviteRecord.premium && inviteRecord.used) {
      return res.status(400).json({ reason: "used" });
    }

    if (inviteRecord.expiresAt && inviteRecord.expiresAt < new Date()) {
      return res.status(400).json({ reason: "expired" });
    }

    // 🔥 NEW: enforce usage limit for premium (if set)
    if (
      inviteRecord.premium &&
      inviteRecord.maxUses !== null &&
      inviteRecord.usedCount >= inviteRecord.maxUses
    ) {
      return res.status(400).json({ reason: "limit_reached" });
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
  tokenVersion: true,
},
    });

    /* =========================
   WELCOME MESSAGE
========================= */

try {
  await sendLynqMessage(
    user.id,
    `🎉 Welcome to LynQ!

We're excited to have you.

✔ Verify your profile to unlock:

• Unlimited messaging
• Media sharing
• Read receipts
• Priority visibility

Need help?

Reply directly to this conversation and the LynQ Team will assist you.

Let's LynQ ❤️`
  );
} catch (err) {
  console.error(
    "WELCOME MESSAGE ERROR:",
    err
  );
}

    /* =========================
       UPDATE INVITE ANALYTICS
    ========================= */

    if (inviteRecord.premium) {
      // 🔥 PREMIUM: increment usage only
      await prisma.invite.update({
        where: { id: inviteRecord.id },
        data: {
          usedCount: {
            increment: 1,
          },
          signupCount: { increment: 1 },
        },
      });
    } else {
      // 🟢 NORMAL: keep existing behavior
      await prisma.invite.update({
        where: { id: inviteRecord.id },
        data: {
          used: true,
          usedAt: new Date(),
          usedById: user.id,
          signupCount: { increment: 1 },
        },
      });
    }

    /* =========================
       ISSUE JWT
    ========================= */

    const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
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