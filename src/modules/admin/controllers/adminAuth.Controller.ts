import { Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AdminLoginBody {
  email: string;
  password: string;
}

export const adminLogin = (req: Request, res: Response) => {
  const { email, password } = req.body as AdminLoginBody;

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("Admin credentials not set in environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET not set");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const token = jwt.sign(
    {
      id: "admin",
      role: "admin",
      email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ ok: true });
};