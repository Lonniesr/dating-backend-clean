"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/* =========================
   ENSURE DIRECTORIES EXIST
========================= */
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "";
        if (file.mimetype.startsWith("image/")) {
            uploadPath = "uploads/chat/images";
        }
        else if (file.mimetype.startsWith("audio/")) {
            uploadPath = "uploads/chat/audio";
        }
        else {
            return cb(new Error("Unsupported file type"), "");
        }
        // ✅ CREATE FOLDER IF IT DOESN'T EXIST
        ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + ext);
    },
});
exports.chatUpload = (0, multer_1.default)({ storage });
