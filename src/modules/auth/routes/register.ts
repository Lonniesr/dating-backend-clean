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
      inviteCode,
    }: {
      email?: string;
      password?: string;
      inviteCode?: string;
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    let invite = null;

    if (inviteCode) {
      invite = await prisma.invite.findUnique({
        where: { code: inviteCode },
      });

      if (!invite) {
        return res.status(400).json({ error: "Invalid invite code" });
      }

      if (invite.used) {
        return res.status(400).json({ error: "Invite already used" });
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invite expired" });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        inviteCode: invite?.code ?? null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingComplete: true,
        createdAt: true,
      },
    });

    if (invite) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: {
          used: true,
          usedAt: new Date(),
          usedById: user.id,
          signupCount: { increment: 1 },
        },
      });
    }

    /**
     * Create JWT session
     */
    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    /**
     * Set auth cookie
     */
    res.cookie("token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return res.status(201).json({ user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;