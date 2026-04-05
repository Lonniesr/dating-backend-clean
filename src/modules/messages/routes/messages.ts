import { Router } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
import multer from "multer";
import path from "path";

const router = Router();

/* =========================
   MULTER SETUP (ADDED)
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/**
 * Resolve conversation
 */
async function resolveConversation(userId: string, id: string) {
  let conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (conversation) return conversation;

  conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: id },
        { userAId: id, userBId: userId },
      ],
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userAId: userId,
        userBId: id,
      },
    });
  }

  return conversation;
}

/**
 * GET messages (unchanged)
 */
router.get("/:id", requireUser, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const conversation = await resolveConversation(userId, id);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error("CHAT FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load chat." });
  }
});

/**
 * POST message (FIXED FOR IMAGE UPLOAD)
 */
router.post(
  "/:id",
  requireUser,
  upload.single("image"), // ✅ THIS IS THE FIX
  async (req: any, res) => {
    try {
      const senderId = req.user.id;
      const id = req.params.id;

      let { text, imageUrl, audioUrl, replyToId } = req.body;

      /* =========================
         HANDLE UPLOADED IMAGE
      ========================= */
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { verified: true },
      });

      if (!sender) {
        return res.status(401).json({ message: "Unauthorized." });
      }

      if (!sender.verified && (imageUrl || audioUrl)) {
        return res.status(403).json({
          message:
            "Verify your profile to send photos and voice messages.",
        });
      }

      if (!text && !imageUrl && !audioUrl) {
        return res.status(400).json({
          message: "Message cannot be empty.",
        });
      }

      const conversation = await resolveConversation(senderId, id);

      const receiverId =
        conversation.userAId === senderId
          ? conversation.userBId
          : conversation.userAId;

      /* BLOCK CHECK */
      const blocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: receiverId },
            { blockerId: receiverId, blockedId: senderId },
          ],
        },
      });

      if (blocked) {
        return res.status(403).json({
          message: "You cannot message this user.",
        });
      }

      const message = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          text: text || null,
          imageUrl: imageUrl || null,
          audioUrl,
          replyToId,
          conversationId: conversation.id,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId: message.id,
          updatedAt: new Date(),
        },
      });

      res.json(message);
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
      res.status(500).json({ message: "Failed to send message." });
    }
  }
);

export default router;