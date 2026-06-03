import prisma from "../prisma";

const LYNQ_TEAM_ID =
  "3e6a706c-b29e-4202-b6f7-89a0e4bf9c4c";

export async function sendLynqMessage(
  userId: string,
  text: string
) {
  if (!userId || !text) {
    throw new Error(
      "userId and text are required"
    );
  }

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
console.log(
  "🔥 LYNQ MESSAGE:",
  userId
);
  const message =
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: LYNQ_TEAM_ID,
        receiverId: userId,
        text,
      },
    });

  await prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      lastMessageId: message.id,
      isSystem: true,
      updatedAt: new Date(),
    },
  });

  return message;
}