import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";
import { supabase } from "../../../services/supabase";

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
      console.log("🔥 ADMIN USER ID:", userId);
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

      console.log("🔥 RAW USER FROM PRISMA:", user);

      /* =========================
         CALCULATE AGE
      ========================= */

      let age: number | null = null;

      if (user.birthdate) {
        const birth = new Date(user.birthdate);
        const today = new Date();

        age = today.getFullYear() - birth.getFullYear();

        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      /* =========================
         DERIVE LOCATION (coords)
      ========================= */

      let location: string | null = null;

      if ((user as any).latitude && (user as any).longitude) {
        location = `${(user as any).latitude}, ${(user as any).longitude}`;
      }

      /* =========================
         GET PHOTOS
      ========================= */

      const photos = await prisma.photo.findMany({
        where: { userId },
        select: { url: true },
      });

      console.log("🔥 PHOTOS:", photos);

      /* =========================
         GET MATCHES
      ========================= */

      const matchesRaw = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        include: {
          userA: { select: { id: true, name: true } },
          userB: { select: { id: true, name: true } },
        },
      });

      console.log("🔥 MATCHES RAW:", matchesRaw);

      const matches = matchesRaw.map((m) => {
        const isUserA = m.userAId === userId;

        return {
          id: m.id,
          otherUserId: isUserA ? m.userB.id : m.userA.id,
          otherUserName:
            isUserA
              ? m.userB.name || "User"
              : m.userA.name || "User",
          createdAt: m.createdAt,
        };
      });

/* =========================
   DASHBOARD COUNTS
========================= */

const [
  messageCount,
  swipeCount,
  inviteCount,
  reportCount,
] = await Promise.all([

  prisma.message.count({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
  }),

  prisma.swipe.count({
    where: {
      swiperId: userId,
    },
  }),

  prisma.invite.count({
  where: {
    invitedById: userId,
  },
}),
  prisma.report.count({
    where: {
      OR: [
        { reporterId: userId },
        { reportedId: userId },
      ],
    },
  }),

]);
/* =========================
   RECENT CONVERSATIONS
========================= */

const conversationsRaw = await prisma.conversation.findMany({
  where: {
    OR: [
      { userAId: userId },
      { userBId: userId },
    ],
  },
  include: {
    userA: {
      select: {
        id: true,
        name: true,
      },
    },
    userB: {
      select: {
        id: true,
        name: true,
      },
    },
    messages: {
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
      select: {
        text: true,
        createdAt: true,
      },
    },
  },
  orderBy: {
    updatedAt: "desc",
  },
  take: 10,
});

const conversations = conversationsRaw.map((c) => {
  const otherUser =
    c.userAId === userId ? c.userB : c.userA;

  return {
    id: c.id,
    otherUserName: otherUser?.name || "Unknown User",
    lastMessage:
      c.messages[0]?.text || "No messages",
    createdAt:
      c.messages[0]?.createdAt || c.updatedAt,
  };
});
/* =========================
   RECENT SWIPES
========================= */

const swipesRaw = await prisma.swipe.findMany({
  where: {
    swiperId: userId,
  },
  include: {
    target: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 20,
});
console.log("🔥 SWIPES RAW:", swipesRaw);
const swipes = swipesRaw.map((swipe) => ({
  id: swipe.id,
  targetName: swipe.target?.name || "Unknown User",
  liked: swipe.liked,
  superLike: swipe.superLike,
  createdAt: swipe.createdAt,
}));
      /* =========================
         FINAL RESPONSE
      ========================= */

      const formatted = {
        id: user.id,

        name: user.name || user.username || "Unnamed User",
        username: user.username,
        email: user.email,

        createdAt: user.createdAt ?? new Date().toISOString(),
        lastActiveAt: user.lastActiveAt ?? null,

        verified: user.verified,
        banned: user.banned,
        shadowBanned: user.shadowBanned,
        role: user.role,
       
        messageCount,
        swipeCount,
        inviteCount,
        reportCount,

        age,
        location,

        photos: photos?.map((p) => p.url) || [],
        matches: matches || [],
        conversations,
        swipes,
      };

      console.log("✅ FINAL RESPONSE:", formatted);

      return res.json(formatted);
    } catch (err) {
      console.error("ADMIN USER DETAIL ERROR:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/* =========================
   DELETE /api/admin/users/:id
========================= */

router.delete(
  "/:id",
  requireAdmin,
  async (req: Request<{ id: string }>, res: Response) => {
    try {
      const userId = req.params.id;

      // Prevent deleting yourself
      if ((req as any).user?.id === userId) {
        return res.status(400).json({
          error: "You cannot delete your own account.",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          email: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      // Don't allow deleting admins
      if (user.role === "admin") {
        return res.status(403).json({
          error: "Admin accounts cannot be deleted.",
        });
      }

      await prisma.$transaction(async (tx) => {
        // Report model has no FK cascade
        await tx.report.deleteMany({
          where: {
            OR: [
              { reporterId: userId },
              { reportedId: userId },
            ],
          },
        });

        // Delete user.
        // Everything with onDelete: Cascade
        // will automatically be removed.
        await tx.user.delete({
          where: {
            id: userId,
          },
        });
      });

     // Remove from Supabase Auth
try {
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    // User is already gone from Supabase Auth.
    if (error.code === "user_not_found") {
      console.log("ℹ️ Supabase Auth user already deleted.");
    } else {
      console.error("SUPABASE DELETE ERROR:", error);

      return res.status(500).json({
        error:
          "User was removed from the database but could not be removed from Supabase Auth.",
      });
    }
  }
} catch (err) {
  console.error("SUPABASE AUTH DELETE FAILED:", err);

  return res.status(500).json({
    error: "Failed to delete user from Supabase Auth.",
  });
}

      return res.json({
        success: true,
        message: "User deleted successfully.",
      });
    } catch (err) {
      console.error("DELETE USER ERROR:", err);

      return res.status(500).json({
        error: "Failed to delete user.",
      });
    }
  }
);

export default router;