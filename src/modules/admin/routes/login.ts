import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../../../prisma";
import { env } from "../../../config/env";

const router = Router();

type AdminLoginBody = {
  email: string;
  password: string;
};

router.post("/", async (req: Request, res: Response) => {
  console.log("🔥🔥 ADMIN LOGIN ROUTE HIT 🔥🔥");
  console.log("Admin raw body:", req.body);

  try {
    const { email, password } = req.body as AdminLoginBody;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        userId: true,
      },
    });

    console.log("Admin found:", admin?.email);

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.password);

    console.log("Admin password match:", ok);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    /* =========================
       CREATE JWT
    ========================= */

    const token = jwt.sign(
      {
        sub: admin.id,
        role: "admin",
        email: admin.email,
        userId: admin.userId ?? null,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* =========================
       SET AUTH COOKIE
    ========================= */

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,               // required for cross-site cookies
      sameSite: "none",           // required for different subdomains
      domain: ".letslynq.com",    // allows letslynq.com + api.letslynq.com
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });

  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;