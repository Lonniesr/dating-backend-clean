import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.delete("/", requireUser, async (req, res) => {
  const userId = req.user!.id;

  try {
    await prisma.$transaction([
      // 1. Delete user's photos
      prisma.photo.deleteMany({
        where: { userId },
      }),

      // 2. Disconnect invites (VERY IMPORTANT)
      prisma.invite.updateMany({
        where: { invitedById: userId },
        data: { invitedById: null },
      }),

      prisma.invite.updateMany({
        where: { usedById: userId },
        data: { usedById: null },
      }),

      // 3. Delete the user
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    res.clearCookie("token");

    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;