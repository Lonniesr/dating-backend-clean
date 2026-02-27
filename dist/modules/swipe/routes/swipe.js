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
 * POST /api/swipe/:id
 * Swipe left or right on a user
 */
router.post("/:id", requireUser_1.requireUser, async (req, res) => {
    var _a;
    try {
        const swiperId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const targetIdParam = req.params.id;
        const { direction } = req.body;
        if (!swiperId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (typeof targetIdParam !== "string") {
            return res.status(400).json({ message: "Invalid target user" });
        }
        if (!["left", "right"].includes(direction)) {
            return res.status(400).json({ message: "Invalid swipe direction" });
        }
        const targetId = targetIdParam;
        // Record the swipe
        await prisma_1.default.swipe.create({
            data: {
                swiperId,
                targetId,
                direction,
            },
        });
        // If right swipe, check for reciprocal right swipe
        if (direction === "right") {
            const reciprocal = await prisma_1.default.swipe.findFirst({
                where: {
                    swiperId: targetId,
                    targetId: swiperId,
                    direction: "right",
                },
            });
            if (reciprocal) {
                const match = await prisma_1.default.match.create({
                    data: {
                        userAId: swiperId,
                        userBId: targetId,
                    },
                });
                return res.json({ match: true, matchData: match });
            }
        }
        return res.json({ match: false });
    }
    catch (err) {
        console.error("SWIPE ERROR:", err);
        return res.status(500).json({ message: "Failed to process swipe." });
    }
});
exports.default = router;
