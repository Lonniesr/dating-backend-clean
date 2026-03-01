"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, "uploads/chat/images");
        }
        else if (file.mimetype.startsWith("audio/")) {
            cb(null, "uploads/chat/audio");
        }
        else {
            cb(new Error("Unsupported file type"), "");
        }
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + ext);
    },
});
exports.chatUpload = (0, multer_1.default)({ storage });
