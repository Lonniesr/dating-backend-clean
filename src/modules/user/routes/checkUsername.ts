import { Router, Request, Response } from "express";
import prisma from "../../../prisma";

const router = Router();

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

router.get("/check-username", async (req: Request, res: Response) => {
  try {
    const username = String(req.query.username || "").toLowerCase().trim();

    // validate format
    if (!USERNAME_REGEX.test(username)) {
      return res.json({
        available: false,
        reason: "invalid"
      });
    }

    const existing = await prisma.user.findUnique({
      where: {
        username
      },
      select: {
        id: true
      }
    });

    res.json({
      available: !existing
    });

  } catch (err) {
    console.error("USERNAME CHECK ERROR:", err);

    res.status(500).json({
      available: false
    });
  }
});

export default router;