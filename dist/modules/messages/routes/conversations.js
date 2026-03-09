"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
/**
 * GET /api/conversations
 * Returns all conversations for the logged-in user
 */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }],
            },
            include: {
                userA: {
                    include: {
                        photos: {
                            orderBy: { order: "asc" },
                            take: 1,
                        },
                    },
                },
                userB: {
                    include: {
                        photos: {
                            orderBy: { order: "asc" },
                            take: 1,
                        },
                    },
                },
                lastMessage: true,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        const formatted = await Promise.all(conversations.map(async (c) => {
            var _a, _b, _c;
            const other = c.userAId === userId ? c.userB : c.userA;
            const unreadCount = await prisma_1.default.message.count({
                where: {
                    conversationId: c.id,
                    receiverId: userId,
                    read: false,
                },
            });
            return {
                conversationId: c.id,
                user: {
                    id: other.id,
                    name: other.name,
                    avatar: (_c = (_b = (_a = other.photos) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : null,
                    online: false,
                },
                lastMessage: c.lastMessage
                    ? {
                        id: c.lastMessage.id,
                        text: c.lastMessage.text,
                        createdAt: c.lastMessage.createdAt,
                        read: c.lastMessage.read,
                        senderId: c.lastMessage.senderId,
                    }
                    : null,
                unreadCount,
            };
        }));
        res.json(formatted);
    }
    catch (err) {
        console.error("CONVERSATIONS ERROR:", err);
        res.status(500).json({
            message: "Failed to load conversations.",
        });
    }
});
exports.default = router;
