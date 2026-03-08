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
    const userId = req.user!.id;
    const { selfieUrl } = req.body;

    if (!selfieUrl) {
      return res.status(400).json({
        message: "Selfie URL required",
      });
    }

    const { error } = await supabase
      .from("users")
      .update({
        verification_selfie: selfieUrl,
        verification_status: "pending",
      })
      .eq("id", userId);

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({
        message: "Verification failed",
      });
    }

    res.json({
      success: true,
      message: "Verification submitted",
    });
  } catch (err) {
    console.error("Verification error:", err);

    res.status(500).json({
      message: "Verification failed",
    });
  }
});

export default router;