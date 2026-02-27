import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.put("/", requireUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, bio } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, bio },
    });

    return res.json({ success: true, user: updated });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;