import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/chat/images");
    } else if (file.mimetype.startsWith("audio/")) {
      cb(null, "uploads/chat/audio");
    } else {
      cb(new Error("Unsupported file type"), "");
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

export const chatUpload = multer({ storage });
