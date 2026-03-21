import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { supabase } from "../../../services/supabase";

const router = Router();

/*
POST /api/user/selfie-verification
User uploads selfie for verification
*/

router.post("/", requireUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { selfieUrl } = req.body;

    console.log("📸 Selfie verification request received");
    console.log("👤 User ID:", userId);
    console.log("🖼️ Selfie URL:", selfieUrl);

    if (!userId) {
      console.error("❌ Missing user ID");
      return res.status(401).json({
        message: "Unauthorized - no user",
      });
    }

    if (!selfieUrl) {
      console.error("❌ Missing selfie URL");
      return res.status(400).json({
        message: "Selfie URL required",
      });
    }

    console.log("🛠️ Updating user verification fields...");

    const { data, error } = await supabase
      .from("User") // ✅ FIXED TABLE NAME
      .update({
        verification_selfie: selfieUrl,
        verification_status: "pending",
      })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("❌ Supabase update error FULL:", error);

      return res.status(500).json({
        message: error.message || "Verification failed",
        details: error,
      });
    }

    console.log("✅ Update success:", data);

    res.json({
      success: true,
      message: "Verification submitted",
    });

  } catch (err: any) {
    console.error("🔥 Verification route crash:", err);

    res.status(500).json({
      message: err?.message || "Verification failed",
    });
  }
});

export default router;