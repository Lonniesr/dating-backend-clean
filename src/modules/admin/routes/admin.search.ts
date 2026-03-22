import { Router } from "express";
import { supabase } from "../../../services/supabase";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/*
GET /api/admin/search?q=...
Search users by name, username, or email
*/

router.get("/", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();

    if (!q) {
      return res.json({ results: [] });
    }

    console.log("🔍 Admin search query:", q);

    const { data, error } = await supabase
      .from("User")
      .select("id, name, username, email, verification_status") // ✅ FIX: removed photos
      .or(`username.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`);

    if (error) {
      console.error("❌ Supabase search error:", error);
      return res.status(500).json({
        message: error.message,
      });
    }

    console.log("✅ Search results:", data);

    res.json({
      results: data || [],
    });

  } catch (err: any) {
    console.error("🔥 Admin search crash:", err);

    res.status(500).json({
      message: err?.message || "Search failed",
    });
  }
});

export default router;