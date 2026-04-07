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
   SEND PUSH
========================= */

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
    await admin.messaging().send({
      token,
      notification: {
        title,
        body,
      },
    });

    console.log("🔥 Push sent");
  } catch (err) {
    console.error("❌ Push error:", err);
  }
}