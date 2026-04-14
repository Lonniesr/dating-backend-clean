import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
import bcrypt from "bcrypt";

const router = Router();

/**
 * PUT /api/users/me
 * Update user profile + password
 */
router.put("/me", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const { name, bio, newPassword } = req.body;

    const data: any = {};

    // ✅ Profile updates
    if (name !== undefined) data.name = name;
    if (bio !== undefined) data.bio = bio;

    // ✅ Password update (simple version for now)
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      data.password = hashed;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;