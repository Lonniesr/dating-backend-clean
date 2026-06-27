import { Router } from "express";
import crypto from "crypto";
import prisma from "../../../prisma";
import { sendPasswordResetEmail } from "../../../services/email";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("🔵 Forgot password request received");

    if (!email || typeof email !== "string") {
      console.log("❌ Invalid email supplied");
      return res.json({
        success: true,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log("🔍 Looking up user:", normalizedEmail);

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    console.log("👤 User found:", !!user);

    // Never reveal whether the account exists
    if (!user) {
      console.log("⚠️ No user found. Returning success.");
      return res.json({
        success: true,
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    console.log("🔑 Reset token generated");

    // Store only the hash
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Expire in one hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    console.log("🧹 Removing previous reset tokens");

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    console.log("💾 Saving new reset token");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    console.log("📧 Calling Resend...");

    await sendPasswordResetEmail(user.email, token);

    console.log("✅ Resend finished successfully");

    console.log(`✅ Password reset email sent to ${user.email}`);

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("❌ FORGOT PASSWORD ERROR:");
    console.error(err);

    return res.json({
      success: true,
    });
  }
});

export default router;