import { Router } from "express";
import { upload } from "../../../middleware/upload";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/**
 * Upload media for chat messages
 * Returns: { url: "/uploads/photos/filename.ext" }
 */
router.post("/", requireUser, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const url = `/uploads/photos/${req.file.filename}`;

    return res.json({ url });
  } catch (err) {
    console.error("CHAT UPLOAD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
