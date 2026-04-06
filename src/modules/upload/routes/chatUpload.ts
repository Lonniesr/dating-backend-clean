import { Router } from "express";
import { requireUser } from "../../../middleware/requireUser";
import { chatUpload } from "../../../middleware/chatUpload";

const router = Router();

router.post(
  "/chat",
  requireUser,
  chatUpload.single("image"), // MUST match frontend
  (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Normalize Windows path → URL safe
      const filePath = req.file.path.replace(/\\/g, "/");

      return res.json({
        url: `/${filePath}`, // example: /uploads/chat/images/123.png
      });

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

export default router;