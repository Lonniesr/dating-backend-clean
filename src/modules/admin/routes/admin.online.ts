
import { Router } from "express";
import prisma from "../../../prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const twoMinutesAgo = new Date(Date.now() - 120000);

  const onlineUsers = await prisma.user.findMany({
    where: {
      lastActiveAt: {
        gte: twoMinutesAgo,
      },
    },
    select: {
      id: true,
    },
  });

  res.json({
    online: onlineUsers.map((u) => u.id),
  });
});

export default router;