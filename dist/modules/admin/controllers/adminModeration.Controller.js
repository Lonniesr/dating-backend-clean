"use strict";
// src/controllers/adminModerationController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectModerationItem = exports.approveModerationItem = exports.getModerationQueue = void 0;
const getModerationQueue = async (req, res) => {
    try {
        const items = [
            {
                id: "user_123",
                name: "John Doe",
                reason: "Inappropriate photos",
                createdAt: new Date().toISOString(),
            },
            {
                id: "user_456",
                name: "Sarah Smith",
                reason: "Harassment report",
                createdAt: new Date().toISOString(),
            },
        ];
        res.json({ items });
    }
    catch (err) {
        console.error("Moderation error:", err);
        res.status(500).json({ error: "Failed to load moderation queue" });
    }
};
exports.getModerationQueue = getModerationQueue;
const approveModerationItem = async (req, res) => {
    const { id } = req.params;
    console.log("Approved moderation item:", id);
    res.json({ ok: true });
};
exports.approveModerationItem = approveModerationItem;
const rejectModerationItem = async (req, res) => {
    const { id } = req.params;
    console.log("Rejected moderation item:", id);
    res.json({ ok: true });
};
exports.rejectModerationItem = rejectModerationItem;
