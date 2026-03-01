"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_1 = require("../../../middleware/upload");
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/**
 * Upload media for chat messages
 * Returns: { url: "/uploads/photos/filename.ext" }
 */
router.post("/", requireUser_1.requireUser, upload_1.upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const url = `/uploads/photos/${req.file.filename}`;
        return res.json({ url });
    }
    catch (err) {
        console.error("CHAT UPLOAD ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
