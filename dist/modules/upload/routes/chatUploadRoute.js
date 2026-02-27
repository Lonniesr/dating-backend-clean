"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const multerChatUpload_1 = __importDefault(require("../multerChatUpload"));
const router = (0, express_1.Router)();
/**
 * Upload media for chat messages
 * Returns: { url: "/uploads/chat/images/xxx.jpg" }
 */
router.post("/", requireUser_1.requireUser, multerChatUpload_1.default.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const url = req.file.mimetype.startsWith("image/")
            ? `/uploads/chat/images/${req.file.filename}`
            : `/uploads/chat/audio/${req.file.filename}`;
        return res.json({ url });
    }
    catch (err) {
        console.error("CHAT UPLOAD ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
