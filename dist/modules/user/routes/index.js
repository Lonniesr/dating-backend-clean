"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const prisma_1 = __importDefault(require("../../../prisma"));
// Controllers
const updateProfile_1 = __importDefault(require("./updateProfile"));
const deletePhoto_1 = __importDefault(require("./deletePhoto"));
const reorderPhotos_1 = __importDefault(require("./reorderPhotos"));
const swipeStats_1 = __importDefault(require("../../swipe/routes/swipeStats"));
const matchCount_1 = __importDefault(require("./matchCount"));
const profileCompletion_1 = __importDefault(require("./profileCompletion"));
const getMatches_1 = __importDefault(require("./getMatches"));
const router = (0, express_1.Router)();
/**
 * USERNAME CHECK
 */
router.get("/check-username", async (req, res) => {
    try {
        const username = String(req.query.username || "").toLowerCase();
        if (!username || username.length < 3) {
            return res.json({ available: false });
        }
        const existing = await prisma_1.default.user.findFirst({
            where: { username },
            select: { id: true },
        });
        res.json({
            available: !existing,
        });
    }
    catch (err) {
        console.error("USERNAME CHECK ERROR:", err);
        res.status(500).json({
            available: false,
        });
    }
});
/**
 * 🔥 SAVE PUSH TOKEN (NEW)
 */
router.post("/push-token", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                error: "No token provided",
            });
        }
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { pushToken: token },
        });
        console.log("🔥 Saved push token:", token);
        res.json({ success: true });
    }
    catch (err) {
        console.error("Push token save error:", err);
        res.status(500).json({
            error: "Failed to save push token",
        });
    }
});
/**
 * PROFILE (ONLY ONE ROUTE)
 */
router.put("/profile", requireUser_1.requireUser, updateProfile_1.default);
/**
 * PHOTOS
 */
router.delete("/photos/:index", requireUser_1.requireUser, deletePhoto_1.default);
router.put("/photos/reorder", requireUser_1.requireUser, reorderPhotos_1.default);
/**
 * MATCHES
 */
router.get("/matches", requireUser_1.requireUser, getMatches_1.default);
/**
 * ANALYTICS
 */
router.get("/swipe-stats", requireUser_1.requireUser, swipeStats_1.default);
router.get("/match-count", requireUser_1.requireUser, matchCount_1.default);
router.get("/profile-completion", requireUser_1.requireUser, profileCompletion_1.default);
exports.default = router;
