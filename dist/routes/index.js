"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routes_1 = __importDefault(require("../modules/auth/routes"));
const me_1 = __importDefault(require("../modules/auth/routes/me"));
const login_1 = __importDefault(require("../modules/admin/routes/login")); // ✅ admin login
const routes_2 = __importDefault(require("../modules/onboarding/routes"));
// import inviteRoutes from "../modules/invite/routes";
const routes_3 = __importDefault(require("../modules/match/routes"));
const routes_4 = __importDefault(require("../modules/messages/routes"));
const routes_5 = __importDefault(require("../modules/discover/routes"));
const routes_6 = __importDefault(require("../modules/swipe/routes"));
const routes_7 = __importDefault(require("../modules/user/routes"));
const chatUploadRoute_1 = __importDefault(require("../modules/upload/routes/chatUploadRoute"));
const router = (0, express_1.Router)();
/**
 * USER AUTH
 * Creates:
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   POST /api/auth/register
 *   GET  /api/auth/me
 */
router.use("/auth", routes_1.default);
/**
 * ADMIN AUTH
 * Creates:
 *   POST /api/admin/login
 */
router.use("/admin/login", login_1.default);
/**
 * CURRENT USER (frontend compatibility)
 * Creates:
 *   GET /api/me
 */
router.use("/me", me_1.default);
/**
 * USER + ONBOARDING
 */
router.use("/onboarding", routes_2.default);
// router.use("/invite", inviteRoutes);
router.use("/user", routes_7.default);
/**
 * UPLOADS (Chat Media)
 */
router.use("/upload/chat", chatUploadRoute_1.default);
/**
 * MATCHING + MESSAGING
 */
router.use("/match", routes_3.default);
router.use("/messages", routes_4.default);
/**
 * DISCOVER + SWIPE
 */
router.use("/discover", routes_5.default);
router.use("/swipe", routes_6.default);
exports.default = router;
