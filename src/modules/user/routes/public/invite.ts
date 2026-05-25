import { Router, Request, Response } from "express";
import prisma from "../../../../prisma";

const router = Router();

/**
 * GET /api/invite/:code
 * Public invite validation
 */
router.get(
  "/:code",
  async (
    req: Request<{ code: string }>,
    res: Response
  ) => {
    try {
      const code = req.params.code;

      if (!code) {
        return res.status(400).json({
          reason: "not_found",
          message: "Invite code required",
        });
      }

      const invite = await prisma.invite.findUnique({
        where: { code },
      });

      if (!invite) {
        return res.status(404).json({
          reason: "not_found",
          message: "Invite not found",
        });
      }

      /* =========================
         SAFE STRING NORMALIZATION
      ========================= */

      const userAgentHeader = req.headers["user-agent"];

      const userAgent =
        typeof userAgentHeader === "string"
          ? userAgentHeader
          : "";

      const ipAddress =
        typeof req.ip === "string"
          ? req.ip
          : "";

      /* =========================
         BASIC DEVICE DETECTION
      ========================= */

      let device = "desktop";

      if (/mobile/i.test(userAgent)) device = "mobile";
      if (/tablet/i.test(userAgent)) device = "tablet";

      /* =========================
         TRACK SCAN (SAFE)
      ========================= */

      try {
        await prisma.inviteScan.create({
          data: {
            inviteId: invite.id,
            device,
            browser: null,
            os: null,
            ip: ipAddress || null,
          },
        });

        await prisma.invite.update({
          where: { id: invite.id },
          data: {
            scanCount: { increment: 1 },
          },
        });

      } catch (analyticsError) {
        console.error(
          "Invite analytics failed:",
          analyticsError
        );
      }

      /* =========================
         VALIDATION
      ========================= */

      if (invite.used) {
        return res.status(400).json({
          reason: "used",
          message: "Invite already used",
        });
      }

      if (
        invite.expiresAt &&
        invite.expiresAt < new Date()
      ) {
        return res.status(410).json({
          reason: "expired",
          message: "Invite expired",
          expiresAt: invite.expiresAt,
        });
      }

      return res.json({
        valid: true,
        code: invite.code,
        premium: invite.premium,
        expiresAt: invite.expiresAt,
        used: invite.used,
      });

    } catch (error) {
      console.error("Public invite lookup error:", error);

      return res.status(500).json({
        reason: "server_error",
        message: "Failed to validate invite",
      });
    }
  }
);

export default router;