import multer from "multer";
import path from "path";
import fs from "fs";

/* =========================
   ENSURE DIRECTORIES EXIST
========================= */

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "";

    if (file.mimetype.startsWith("image/")) {
      uploadPath = "uploads/chat/images";
    } else if (file.mimetype.startsWith("audio/")) {
      uploadPath = "uploads/chat/audio";
    } else {
      return cb(new Error("Unsupported file type"), "");
    }

    // ✅ CREATE FOLDER IF IT DOESN'T EXIST
    ensureDir(uploadPath);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

export const chatUpload = multer({ storage });