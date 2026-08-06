import prisma from "../prisma";
import { io } from "../server";

export async function emitBadgeUpdate(
  userId: string
) {
  console.log("🔥 emitBadgeUpdate CALLED:", userId);

  try {
    /* =========================
       UNREAD MESSAGES
    ========================= */

    const unreadMessages =
      await prisma.message.count({
        where: {
          receiverId: userId,
          read: false,
        },
      });

    /* =========================
       NEW LIKES
    ========================= */

    const newLikes =
      await prisma.swipe.count({
        where: {
          targetId: userId,
          liked: true,
        },
      });

    /* =========================
       NEW MATCHES
    ========================= */

    const newMatches =
      await prisma.match.count({
        where: {
          OR: [
            {
              userAId: userId,
              userASeen: false,
            },
            {
              userBId: userId,
              userBSeen: false,
            },
          ],
        },
      });

    /* =========================
       PHOTO REQUESTS
    ========================= */

    const photoRequests =
      await prisma.photoAccessRequest.count({
        where: {
          ownerId: userId,
          status: "pending",
        },
      });

    const badges = {
      unreadMessages,
      newLikes,
      newMatches,
      photoRequests,
    };

    console.log("📤 EMITTING BADGES TO:", `user:${userId}`);

    io.to(`user:${userId}`).emit(
      "badges",
      badges
    );

    console.log(
      "📬 BADGES UPDATED:",
      userId,
      badges
    );
  } catch (err) {
    console.error(
      "❌ Badge update failed:",
      err
    );
  }
}