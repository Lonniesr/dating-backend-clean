import { Router } from "express";

const router = Router();

// GET /api/admin/users/:id
router.get("/users/:id", async (req: any, res) => {
  const prisma = req.prisma;
  const userId = req.params.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        age: true,
        location: true,
        photos: true,
        createdAt: true,
        lastActiveAt: true,

        matchesInitiated: {
          select: {
            id: true,
            createdAt: true,
            userB: { select: { id: true, name: true } },
          },
        },
        matchesReceived: {
          select: {
            id: true,
            createdAt: true,
            userA: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const matches = [
      ...user.matchesInitiated.map((m: any) => ({
        id: m.id,
        createdAt: m.createdAt,
        otherUserId: m.userB.id,
        otherUserName: m.userB.name,
      })),
      ...user.matchesReceived.map((m: any) => ({
        id: m.id,
        createdAt: m.createdAt,
        otherUserId: m.userA.id,
        otherUserName: m.userA.name,
      })),
    ];

    return res.json({ ...user, matches });
  } catch (err) {
    console.error("ADMIN USER DETAIL ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;