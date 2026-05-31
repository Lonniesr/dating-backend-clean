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
   SEND PUSH (DATA ONLY TEST)
========================= */

export async function sendPushNotification({
  token,
  title,
  body,
  data,
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  try {
    await admin.messaging().send({
      token,

      // 🔥 DATA ONLY
      data: {
        title,
        body,
        ...(data || {}),
      },
    });

    console.log("🔥 Push sent");
  } catch (err) {
    console.error("❌ Push error:", err);
  }
}