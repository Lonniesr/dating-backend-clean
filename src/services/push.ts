import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    ),
  });
}

export async function sendPushNotification({
  token,
  title,
  body,
}: {
  token: string;
  title: string;
  body: string;
}) {
  try {
    const res = await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: "/icon.png",
          badge: "/badge.png",
        },
      },
    });

    console.log("🔥 Push success:", res);
  } catch (err: any) {
    console.error("❌ Push error FULL:", err);

    // 🔥 AUTO CLEAN INVALID TOKENS
    if (
      err.code === "messaging/registration-token-not-registered" ||
      err.code === "messaging/invalid-registration-token"
    ) {
      console.log("⚠️ Invalid token, should remove from DB");
    }
  }
}