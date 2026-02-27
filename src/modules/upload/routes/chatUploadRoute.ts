import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import chatUpload from "../multerChatUpload";
const router = Router();

/**
 * Upload media for chat messages
 * Returns: { url: "/uploads/chat/images/xxx.jpg" }
 */
router.post("/", requireUser, chatUpload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const url =
      req.file.mimetype.startsWith("image/")
        ? `/uploads/chat/images/${req.file.filename}`
        : `/uploads/chat/audio/${req.file.filename}`;

    return res.json({ url });
  } catch (err) {
    console.error("CHAT UPLOAD ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
