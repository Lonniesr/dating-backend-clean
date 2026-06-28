import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../../../prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (
      !token ||
      typeof token !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid request",
      });
    }

    // Password must contain:
    // - at least 8 characters
    // - one uppercase letter
    // - one lowercase letter
    // - one number
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include an uppercase letter, lowercase letter and a number.",
      });
    }

    // Hash the incoming token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return res.status(400).json({
        error: "This password reset link is invalid or has expired.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
  password: hashedPassword,
  tokenVersion: {
    increment: 1,
  },
},
      }),

      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          used: true,
        },
      }),

      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      }),
    ]);

    console.log(
      `✅ Password successfully reset for user ${resetToken.userId}`
    );

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;