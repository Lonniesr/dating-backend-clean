import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../../../prisma";
import { env } from "../../../config/env";
import {
  checkBruteForce,
  registerFailure,
  resetFailures,
} from "../../../middleware/bruteForce";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    await checkBruteForce(req, email, "user");

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.banned) {
      await registerFailure(email, "user");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await registerFailure(email, "user");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await resetFailures(email, "user");

    // 🔐 CLEAN JWT (database is source of truth)
    const token = jwt.sign(
      { sub: user.id },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;