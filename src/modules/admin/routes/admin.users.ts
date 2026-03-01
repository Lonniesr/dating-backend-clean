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
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
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
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user);
    } catch (err) {
      console.error("ADMIN USER DETAIL ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;