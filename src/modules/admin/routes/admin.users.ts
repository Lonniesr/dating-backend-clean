import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/* =========================
   TYPES
========================= */

interface UserListQuery {
  page?: string;
  limit?: string;
  search?: string;
}

/* =========================
   GET /api/admin/users
========================= */

router.get(
  "/",
  requireAdmin,
  async (req: Request<{}, {}, {}, UserListQuery>, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) || 1 : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) || 20 : 20;
      const search = req.query.search?.trim() || "";

      let where: any = {};

      if (search) {
        where = {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        };
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          verified: true,
          banned: true,
          createdAt: true,
          lastActiveAt: true,
        },
      });

      const total = await prisma.user.count({ where });

      return res.json({
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.error("ADMIN USER LIST ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/* =========================
   GET /api/admin/users/:id
========================= */

router.get(
  "/:id",
  requireAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const userId = req.params.id;

      console.log("🔍 Fetching admin user:", userId);

      /* =========================
         GET USER
      ========================= */

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      /* =========================
         GET PHOTOS
      ========================= */

      const photos = await prisma.photo.findMany({
        where: { userId },
        select: { url: true },
      });

      /* =========================
         GET MATCHES
      ========================= */

      const matchesRaw = await prisma.match.findMany({
        where: {
          OR: [
            { userAId: userId },
            { userBId: userId },
          ],
        },
        include: {
          userA: { select: { id: true, name: true } },
          userB: { select: { id: true, name: true } },
        },
      });

      const matches = matchesRaw.map((m) => {
        const isUserA = m.userAId === userId;

        return {
          id: m.id,
          otherUserId: isUserA ? m.userB.id : m.userA.id,
          otherUserName: isUserA ? m.userB.name : m.userA.name,
          createdAt: m.createdAt,
        };
      });

      /* =========================
         FINAL RESPONSE
      ========================= */

      const formatted = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,

        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,

        verified: user.verified,
        banned: user.banned,
        role: user.role,

        age: null,
        location: (user as any).location ?? null,

        photos: photos.map((p) => p.url),
        matches,
      };

      console.log("✅ Admin user detail response:", formatted);

      return res.json(formatted);
    } catch (err) {
      console.error("ADMIN USER DETAIL ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;