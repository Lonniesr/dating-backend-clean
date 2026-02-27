import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.put("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { push, email } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        preferences: {
          ...(req.user.preferences ?? {}),
          notifications: { push, email },
        },
      },
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("UPDATE NOTIFICATIONS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;