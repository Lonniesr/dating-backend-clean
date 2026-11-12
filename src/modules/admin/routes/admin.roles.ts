import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

const roles = [
  { id: "admin", name: "Admin" },
  { id: "ambassador", name: "Ambassador" },
  { id: "user", name: "Member" },
] as const;

type RoleId = (typeof roles)[number]["id"];

const roleUserFields = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  role: true,
} as const;

function isRoleId(value: unknown): value is RoleId {
  return roles.some((role) => role.id === value);
}

/**
 * GET /api/admin/roles
 */
router.get("/", requireAdmin, (_req, res) => {
  res.json({ roles });
});

/**
 * GET /api/admin/roles/users?role=ambassador
 */
router.get("/users", requireAdmin, async (req, res) => {
  const { role } = req.query;

  if (!isRoleId(role)) {
    res.status(400).json({ error: "Choose a valid role." });
    return;
  }

  try {
    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: "desc" },
      select: roleUserFields,
    });

    res.json({ users });
  } catch (error) {
    console.error("ADMIN ROLE USERS ERROR:", error);
    res.status(500).json({ error: "Could not load users for this role." });
  }
});

/**
 * POST /api/admin/roles/assign
 */
router.post("/assign", requireAdmin, async (req, res) => {
  const { userId, role } = req.body ?? {};

  if (typeof userId !== "string" || !userId.trim() || !isRoleId(role)) {
    res.status(400).json({
      error: "Enter a user ID and choose a valid role.",
    });
    return;
  }

  const id = userId.trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.user.updateMany({
        where: {
          id,
          ...(role !== "admin"
            ? { role: { notIn: ["admin", "ADMIN"] } }
            : {}),
        },
        data: { role },
      });

      if (count === 0) {
        const existingUser = await tx.user.findUnique({
          where: { id },
          select: { id: true },
        });

        return {
          status: existingUser ? ("protected" as const) : ("missing" as const),
        };
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id },
        select: roleUserFields,
      });

      return { status: "updated" as const, user };
    });

    if (result.status === "missing") {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (result.status === "protected") {
      res.status(409).json({
        error: "This page cannot change an Admin to Ambassador or Member.",
      });
      return;
    }

    res.json({ user: result.user });
  } catch (error) {
    console.error("ADMIN ROLE ASSIGN ERROR:", error);
    res.status(500).json({ error: "Could not assign the role." });
  }
});

export default router;