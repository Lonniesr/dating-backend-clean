"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser"); // ✅ FIXED
const upload_1 = require("../../../middleware/upload");
// Controllers
const updateProfile_1 = __importDefault(require("./updateProfile"));
const editProfile_1 = __importDefault(require("./editProfile"));
const uploadPhoto_1 = __importDefault(require("./uploadPhoto"));
const deletePhoto_1 = __importDefault(require("./deletePhoto"));
const reorderPhotos_1 = __importDefault(require("./reorderPhotos"));
const swipeStats_1 = __importDefault(require("../../swipe/routes/swipeStats"));
const matchCount_1 = __importDefault(require("./matchCount"));
const profileCompletion_1 = __importDefault(require("./profileCompletion"));
const getMatches_1 = __importDefault(require("./getMatches"));
const router = (0, express_1.Router)();
/**
 * PROFILE
 */
router.get("/edit", requireUser_1.requireUser, editProfile_1.default);
router.put("/update", requireUser_1.requireUser, updateProfile_1.default);
/**
 * PHOTOS
 */
router.post("/photos/upload", requireUser_1.requireUser, upload_1.upload.single("photo"), uploadPhoto_1.default);
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
