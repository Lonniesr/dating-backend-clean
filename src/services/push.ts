import admin from "firebase-admin";

/* =========================
   INIT FIREBASE ADMIN
========================= */

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    ),
  });
}

/* =========================
   SEND PUSH (UPDATED)
========================= */

export async function sendPushNotification({
  token,
  title,
  body,
  data, // 🔥 NEW
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>; // 🔥 NEW
}) {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
      data, // 🔥 THIS ENABLES DEEP LINKING
    });

    console.log("🔥 Push sent");
  } catch (err) {
    console.error("❌ Push error:", err);
  }
}