import { Router, Request, Response } from "express";
import prisma from "../../../prisma";
import { requireUser } from "../../../middleware/requireUser";
import { sendLynqMessage } from "../../../utils/sendLynqMessage";

const router = Router();

/**
 * POST /api/onboarding/complete
 * Marks onboarding as finished
 */
router.post("/", requireUser, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
      },
      select: {
        id: true,
        onboardingComplete: true,
      },
    });

    /* =========================
       PERSONAL INVITE FLOW
    ========================= */

    try {
      const invite = await prisma.invite.findFirst({
        where: {
          usedById: userId,
          redirectToInviter: true,
          invitedById: {
            not: null,
          },
        },
        include: {
          invitedBy: true,
          usedBy: true,
        },
      });

      if (
        invite &&
        invite.invitedBy &&
        invite.usedBy
      ) {
        const inviterId = invite.invitedBy.id;
        const inviteeId = invite.usedBy.id;

        console.log(
          "🔥 PERSONAL INVITE FOUND:",
          inviterId,
          inviteeId
        );

        let conversation =
          await prisma.conversation.findFirst({
            where: {
              OR: [
                {
                  userAId: inviterId,
                  userBId: inviteeId,
                },
                {
                  userAId: inviteeId,
                  userBId: inviterId,
                },
              ],
            },
          });

       if (!conversation) {
  conversation =
    await prisma.conversation.create({
      data: {
        userAId: inviterId,
        userBId: inviteeId,
      },
    });

  const firstMessage =
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: inviterId,
        receiverId: inviteeId,
        text:
          "👋 Thanks for joining LynQ through my personal invite. Feel free to say hello!",
      },
    });

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      lastMessageId: firstMessage.id,
    },
  });

  console.log(
    "🔥 INVITER CONVERSATION CREATED:",
    conversation.id
  );
}

        await sendLynqMessage(
          inviteeId,
          `👋 Welcome to LynQ!

${invite.invitedBy.name || "A LynQ member"} invited you into the community.

A connection has been created between the two of you.

Feel free to visit their profile and introduce yourself.`
        );

        await sendLynqMessage(
          inviterId,
          `🎉 Your invite was accepted!

${invite.usedBy.name || "A new member"} joined LynQ using your personal invite.

A connection has been created so the two of you can get acquainted.`
        );
      }
    } catch (err) {
      console.error(
        "PERSONAL INVITE FLOW ERROR:",
        err
      );
    }

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("ONBOARDING /complete ERROR:", err);

    return res.status(500).json({
      error: "Failed to complete onboarding",
    });
  }
});

export default router;