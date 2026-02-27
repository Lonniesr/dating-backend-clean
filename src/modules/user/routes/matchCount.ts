import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

router.get("/", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.match.count({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      }
    });

    return res.json({ count });
  } catch (err) {
    console.error("MATCH COUNT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;