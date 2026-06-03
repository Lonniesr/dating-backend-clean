import prisma from "../prisma";

const LYNQ_TEAM_ID =
  "3e6a706c-b29e-4202-b6f7-89a0e4bf9c4c";

export async function sendLynqMessage(
  userId: string,
  text: string
) {
  try {
    if (!userId || !text) {
      throw new Error(
        "userId and text are required"
      );
    }

    console.log(
      "🔥 LYNQ MESSAGE START:",
      userId
    );

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
      console.log(
        "🔥 CREATING CONVERSATION"
      );

      conversation =
        await prisma.conversation.create({
          data: {
            userAId: LYNQ_TEAM_ID,
            userBId: userId,
            isSystem: true,
          },
        });

      console.log(
        "🔥 CONVERSATION CREATED:",
        conversation.id
      );
    } else {
      console.log(
        "🔥 CONVERSATION FOUND:",
        conversation.id
      );
    }

    const message =
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: LYNQ_TEAM_ID,
          receiverId: userId,
          text,
        },
      });

    console.log(
      "🔥 MESSAGE CREATED:",
      message.id
    );

    await prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        lastMessageId: message.id,
        isSystem: true,
      },
    });

    console.log(
      "🔥 CONVERSATION UPDATED:",
      conversation.id
    );

    return message;
  } catch (err) {
    console.error(
      "❌ SEND LYNQ MESSAGE ERROR:",
      err
    );

    throw err;
  }
}