import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.delete("/", requireUser, async (req, res) => {
  try {
    const userId = req.user!.id;

    await prisma.user.delete({
      where: { id: userId },
    });

    res.clearCookie("token");

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
