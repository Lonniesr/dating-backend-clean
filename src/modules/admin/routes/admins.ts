import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../../prisma";
const router = Router();

/**
 * GET /admins
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        User: true, // ⚠️ Prisma relations are case-sensitive
      },
    });

    return res.json({ success: true, admins });
  } catch (err) {
    console.error("GET /admins error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * POST /admins
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, password, userId } = req.body as {
      email: string;
      password: string;
      userId?: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashed,
        userId: userId ?? null,
      },
    });

    return res.json({ success: true, admin });
  } catch (err) {
    console.error("POST /admins error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * DELETE /admins/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Missing id",
      });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE /admins error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;