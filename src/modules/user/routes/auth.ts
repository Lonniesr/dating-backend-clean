import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";

/* =========================
   USER SIGNUP
========================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET not configured");
    }

    // ✅ Use `sub` to match requireUser
    const token = jwt.sign(
      { sub: user.id, role: "user" },
      secret,
      { expiresIn: "7d" }
    );

    // ✅ Set cookie properly for both local + prod
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,          // true in prod (HTTPS)
      sameSite: isProduction ? "none" : "lax",
    });

    // ✅ Also return token for Postman testing
    return res.json({
      success: true,
      token,
    });

  } catch (err) {
    console.error("USER SIGNUP ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


/* =========================
   USER LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET not configured");
    }

    // ✅ Use `sub` for consistency
    const token = jwt.sign(
      { sub: user.id, role: "user" },
      secret,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.json({
      success: true,
      token, // 👈 makes Postman MUCH easier
    });

  } catch (err) {
    console.error("USER LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


/* =========================
   CURRENT USER
========================= */
router.get("/me", requireUser, (req: any, res) => {
  return res.json({ user: req.user });
});


/* =========================
   LOGOUT
========================= */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ success: true });
});

export default router;