import { Router } from "express";
import { supabase } from "../../../services/supabase";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/* =========================
   GET ALL PENDING VERIFICATIONS
========================= */

router.get("/", requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("User") // ✅ FIXED
      .select("id, name, username, verification_selfie, verification_status")
      .eq("verification_status", "pending");

    if (error) {
      console.error("❌ Fetch error FULL:", error);
      throw error;
    }

    console.log("📦 Verification queue:", data); // ✅ DEBUG

    res.json(data);
  } catch (err) {
    console.error("Fetch verification queue error:", err);
    res.status(500).json({ message: "Failed to fetch verification queue" });
  }
});

/* =========================
   APPROVE USER
========================= */

router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("✅ Approving user:", id);

    const { error } = await supabase
      .from("User") // ✅ FIXED
      .update({
        verified: true,
        verification_status: "approved",
      })
      .eq("id", id);

    if (error) {
      console.error("❌ Approve error FULL:", error);
      throw error;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ message: "Approve failed" });
  }
});

/* =========================
   REJECT USER
========================= */

router.post("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log("❌ Rejecting user:", id);

    const { error } = await supabase
      .from("User") // ✅ FIXED
      .update({
        verified: false,
        verification_status: "rejected",
      })
      .eq("id", id);

    if (error) {
      console.error("❌ Reject error FULL:", error);
      throw error;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ message: "Reject failed" });
  }
});

export default router;