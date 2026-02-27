"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/**
 * GET /api/messages/:id
 * Returns full chat history with a specific user
 */
router.get("/:id", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const otherId = req.params.id;
        // Find or create conversation
        let conversation = await prisma_1.default.conversation.findFirst({
            where: {
                OR: [
                    { userAId: userId, userBId: otherId },
                    { userAId: otherId, userBId: userId },
                ],
            },
        });
        if (!conversation) {
            conversation = await prisma_1.default.conversation.create({
                data: {
                    userAId: userId,
                    userBId: otherId,
                },
            });
        }
        const messages = await prisma_1.default.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
        });
        // Mark unread messages as read
        await prisma_1.default.message.updateMany({
            where: {
                conversationId: conversation.id,
                receiverId: userId,
                read: false,
            },
            data: { read: true },
        });
        res.json(messages);
    }
    catch (err) {
        console.error("CHAT FETCH ERROR:", err);
        res.status(500).json({ message: "Failed to load chat." });
    }
});
/**
 * POST /api/messages/:id
 * Send a message to a specific user
 */
router.post("/:id", requireUser_1.requireUser, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;
        const { text } = req.body;
        // Find or create conversation
        let conversation = await prisma_1.default.conversation.findFirst({
            where: {
                OR: [
                    { userAId: senderId, userBId: receiverId },
                    { userAId: receiverId, userBId: senderId },
                ],
            },
        });
        if (!conversation) {
            conversation = await prisma_1.default.conversation.create({
                data: {
                    userAId: senderId,
                    userBId: receiverId,
                },
            });
        }
        // Create message
        const message = await prisma_1.default.message.create({
            data: {
                senderId,
                receiverId,
                text,
                conversationId: conversation.id,
            },
        });
        // Update lastMessage pointer
        await prisma_1.default.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageId: message.id,
                updatedAt: new Date(),
            },
        });
        res.json(message);
    }
    catch (err) {
        console.error("SEND MESSAGE ERROR:", err);
        res.status(500).json({ message: "Failed to send message." });
    }
});
exports.default = router;
