import { Router } from "express";
import prisma from "../../../prisma";
import { requireAdmin } from "../../../middleware/requireAdmin";
import {
  sendAdminMessage,
  LYNQ_TEAM_ID,
} from "../../../services/adminMessaging";

const router = Router();



/* =========================
   GET ALL MESSAGES
========================= */

router.get(
  "/",
  requireAdmin,
  async (_req, res) => {
    try {
      const messages =
        await prisma.message.findMany({
          orderBy: {
            createdAt: "desc",
          },

          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json({
        messages,
      });
    } catch (err) {
      console.error(
        "ADMIN MESSAGES ERROR:",
        err
      );

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);


/* =========================
   GET CONVERSATION
========================= */

router.get(
  "/conversation",
  requireAdmin,
  async (req, res) => {
    try {
      const userA = String(req.query.userA || "");
      const userB = String(req.query.userB || "");

      if (!userA || !userB) {
        return res.status(400).json({
          error: "userA and userB required",
        });
      }

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: userA,
              receiverId: userB,
            },
            {
              senderId: userB,
              receiverId: userA,
            },
          ],
        },

        orderBy: {
          createdAt: "asc",
        },

        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({
        messages,
      });
    } catch (err) {
      console.error(
        "GET CONVERSATION ERROR:",
        err
      );

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

/* =========================
   SEND TO ONE USER
========================= */

router.post(
  "/user",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        userId,
        message,
      } = req.body;

      if (!userId || !message) {
        return res.status(400).json({
          error:
            "userId and message required",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      const created =
        await sendAdminMessage(
          user.id,
          message
        );

      return res.json({
        success: true,
        messageId: created.id,
      });
    } catch (err) {
      console.error(
        "SEND ADMIN MESSAGE ERROR:",
        err
      );

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

/* =========================
   SEND TO ALL USERS
========================= */

router.post(
  "/all",
  requireAdmin,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          error: "Message required",
        });
      }

      const users =
        await prisma.user.findMany({
          where: {
            id: {
              not: LYNQ_TEAM_ID,
            },
          },

          select: {
            id: true,
          },
        });

      for (const user of users) {
        await sendAdminMessage(
          user.id,
          message
        );
      }

      return res.json({
        success: true,
        sent: users.length,
      });
    } catch (err) {
      console.error(
        "SEND ALL ERROR:",
        err
      );

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

/* =========================
   SEND TO VERIFIED
========================= */

router.post(
  "/verified",
  requireAdmin,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          error: "Message required",
        });
      }

      const users =
        await prisma.user.findMany({
          where: {
            verified: true,

            id: {
              not: LYNQ_TEAM_ID,
            },
          },

          select: {
            id: true,
          },
        });

      for (const user of users) {
        await sendAdminMessage(
          user.id,
          message
        );
      }

      return res.json({
        success: true,
        sent: users.length,
      });
    } catch (err) {
      console.error(
        "SEND VERIFIED ERROR:",
        err
      );

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

/* =========================
   SEND TO UNVERIFIED
========================= */

router.post(
  "/unverified",
  requireAdmin,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({
          error: "Message required",
        });
      }

      const users =
        await prisma.user.findMany({
          where: {
            verified: false,

            id: {
              not: LYNQ_TEAM_ID,
            },
          },

          select: {
            id: true,
          },
        });

      for (const user of users) {
        await sendAdminMessage(
          user.id,
          message
        );
      }

      return res.json({
        success: true,
        sent: users.length,
      });
    } catch (err) {
      console.error(
        "SEND UNVERIFIED ERROR:",
        err
      );

      return res.status(500).json({
        error: "Server error",
      });
    }
  }
);

export default router;