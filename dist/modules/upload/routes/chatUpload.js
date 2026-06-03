"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const chatUpload_1 = require("../../../middleware/chatUpload");
const router = (0, express_1.Router)();
router.post("/chat", requireUser_1.requireUser, chatUpload_1.chatUpload.single("image"), // MUST match frontend
(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Normalize Windows path → URL safe
        const filePath = req.file.path.replace(/\\/g, "/");
        return res.json({
            url: `/${filePath}`, // example: /uploads/chat/images/123.png
        });
    }
    catch (err) {
        console.error("UPLOAD ERROR:", err);
        res.status(500).json({ message: "Upload failed" });
    }
});
exports.default = router;
