import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend Error:", error);
      throw new Error(error.message);
    }

    console.log("✅ Email sent:", data?.id);

    return data;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw err;
  }
}

/**
 * Password Reset Email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Reset your LynQ password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <h2>LynQ Password Reset</h2>

        <p>We received a request to reset your password.</p>

        <p>
          <a
            href="${resetLink}"
            style="
              display:inline-block;
              background:#5A67FF;
              color:white;
              padding:12px 24px;
              border-radius:8px;
              text-decoration:none;
            "
          >
            Reset Password
          </a>
        </p>

        <p>
          Or copy this link into your browser:
        </p>

        <p>${resetLink}</p>

        <p>This link expires in 1 hour.</p>

        <p>If you didn't request this, you can safely ignore this email.</p>

        <hr>

        <small>LynQ Team</small>
      </div>
    `,
  });
}