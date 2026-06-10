import prisma from "../prisma";

export const LYNQ_TEAM_ID =
  "3e6a706c-b29e-4202-b6f7-89a0e4bf9c4c";

/* =========================
   RESOLVE CONVERSATION
========================= */

async function resolveConversation(
  userId: string
) {
  let conversation =
    await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            userAId: LYNQ_TEAM_ID,
            userBId: userId,
          },
          {
            userAId: userId,
            userBId: LYNQ_TEAM_ID,
          },
        ],
      },
    });

  if (!conversation) {
    conversation =
      await prisma.conversation.create({
        data: {
          userAId: LYNQ_TEAM_ID,
          userBId: userId,
          isSystem: true,
        },
      });
  }

  return conversation;
}

/* =========================
   SEND ADMIN MESSAGE
========================= */

export async function sendAdminMessage(
  userId: string,
  text: string
) {
  const conversation =
    await resolveConversation(userId);

  const message =
    await prisma.message.create({
      data: {
        senderId: LYNQ_TEAM_ID,
        receiverId: userId,
        conversationId: conversation.id,
        text,
      },
    });

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      isSystem: true,
      lastMessageId: message.id,
      updatedAt: new Date(),
    },
  });

  return message;
}