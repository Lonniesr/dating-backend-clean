import { Router } from "express";
import crypto from "crypto";
import prisma from "../../../prisma";
import { sendPasswordResetEmail } from "../../../services/email";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.json({
        success: true,
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

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Store only the hash
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Expire in one hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Remove any previous reset links
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Save new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send email
    await sendPasswordResetEmail(user.email, token);

    console.log(`✅ Password reset email sent to ${user.email}`);

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);

    // Do not leak errors to client
    return res.json({
      success: true,
    });
  }
});

export default router;