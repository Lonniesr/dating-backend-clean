import { Router } from "express";
import crypto from "crypto";
import prisma from "../../../prisma";
import { sendPasswordResetEmail } from "../../../services/email";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    // Invalid request
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    // Never reveal whether the account exists
    if (!user) {
      return res.json({
        success: true,
      });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");

    // Store only the hashed token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

      // expires 1
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Remove any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Save new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, token);

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);

    // Never expose internal errors or account existence
    return res.json({
      success: true,
    });
  }
});

export default router;