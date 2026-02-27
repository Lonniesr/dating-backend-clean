import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../../prisma";
import { env } from "../../../config/env";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hash },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingComplete: true,
        createdAt: true,
      },
    });

    // Optional: auto-login on register (if you want)
    // If you don't want register to issue a cookie, remove this block.
    // const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;