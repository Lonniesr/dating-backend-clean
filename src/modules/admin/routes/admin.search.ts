import { Router } from "express";
import { supabase } from "../../../services/supabase";
import { requireAdmin } from "../../../middleware/requireAdmin";

const router = Router();

/*
GET /api/admin/search?q=...
Search users by name, username, email, or ID
*/

router.get("/", requireAdmin, async (req, res) => {
  try {
    const q = (req.query.q as string)?.trim();

    if (!q) {
      return res.json({ results: [] });
    }

    console.log("🔍 Admin search query:", q);

    const { data, error } = await supabase
      .from("User") // ✅ IMPORTANT
      .select("id, name, username, email, photos, verification_status")
      .or(`
        username.ilike.%${q}%,
        name.ilike.%${q}%,
        email.ilike.%${q}%
      `);

    if (error) {
      console.error("❌ Search error:", error);
      throw error;
    }

    res.json({
      results: data || [],
    });

  } catch (err) {
    console.error("🔥 Admin search failed:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

export default router;