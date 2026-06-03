"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/* ============================
   GET USER CONVERSATIONS
============================ */
router.get("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = user.id;
        const blocks = await prisma_1.default.block.findMany({
            where: {
                OR: [
                    { blockerId: userId },
                    { blockedId: userId }
                ]
            },
            select: {
                blockerId: true,
                blockedId: true
            }
        });
        const blockedIds = new Set();
        for (const b of blocks) {
            if (b.blockerId === userId)
                blockedIds.add(b.blockedId);
            if (b.blockedId === userId)
                blockedIds.add(b.blockerId);
        }
        const conversations = await prisma_1.default.conversation.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: {
                userA: {
                    select: {
                        id: true,
                        name: true,
                        photos: true
                    }
                },
                userB: {
                    select: {
                        id: true,
                        name: true,
                        photos: true
                    }
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: "desc"
            }
        });
        const formatted = await Promise.all(conversations.map(async (c) => {
            var _a, _b, _c;
            const otherUser = c.userAId === userId ? c.userB : c.userA;
            if (!otherUser)
                return null;
            if (blockedIds.has(otherUser.id))
                return null;
            const lastMessage = c.messages[0] || null;
            const unreadCount = await prisma_1.default.message.count({
                where: {
                    conversationId: c.id,
                    receiverId: userId,
                    read: false
                }
            });
            return {
                conversationId: c.id,
                user: {
                    id: otherUser.id,
                    name: otherUser.name,
                    avatar: (_c = (_b = (_a = otherUser.photos) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : null
                },
                lastMessage: lastMessage
                    ? {
                        text: lastMessage.text,
                        createdAt: lastMessage.createdAt
                    }
                    : null,
                unreadCount
            };
        }));
        res.json(formatted.filter(Boolean));
    }
    catch (err) {
        console.error("GET CONVERSATIONS ERROR:", err);
        res.status(500).json({ error: "Failed to load conversations" });
    }
});
/* ============================
   GET OR CREATE CONVERSATION
============================ */
router.get("/:matchId", requireUser_1.requireUser, async (req, res) => {
    try {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = user.id;
        /* ✅ FIX: Properly narrow matchId */
        const matchParam = req.params.matchId;
        if (typeof matchParam !== "string") {
            return res.status(400).json({ error: "Invalid matchId" });
        }
        const matchId = matchParam;
        const blocked = await prisma_1.default.block.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: matchId },
                    { blockerId: matchId, blockedId: userId }
                ]
            }
        });
        if (blocked) {
            return res.status(403).json({
                error: "You cannot interact with this user"
            });
        }
        const [userAId, userBId] = [userId, matchId].sort();
        const conversation = await prisma_1.default.conversation.upsert({
            where: {
                userAId_userBId: {
                    userAId,
                    userBId
                }
            },
            update: {},
            create: {
                userAId,
                userBId
            }
        });
        res.json(conversation);
    }
    catch (err) {
        console.error("CONVERSATION ERROR:", err);
        res.status(500).json({ error: "Failed to load conversation" });
    }
});
exports.default = router;
