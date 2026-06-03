"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../middleware/requireUser");
const updateLastActive_1 = require("../middleware/updateLastActive");
/* =========================
   USER ROUTES
========================= */
const routes_1 = __importDefault(require("../modules/auth/routes"));
const routes_2 = __importDefault(require("../modules/onboarding/routes"));
const routes_3 = __importDefault(require("../modules/match/routes"));
/* 🔥 FIXED IMPORT */
const messages_1 = __importDefault(require("../modules/messages/routes/messages"));
const conversations_1 = __importDefault(require("../modules/messages/routes/conversations"));
const routes_4 = __importDefault(require("../modules/discover/routes"));
const routes_5 = __importDefault(require("../modules/swipe/routes"));
const routes_6 = __importDefault(require("../modules/user/routes"));
const profile_1 = __importDefault(require("../modules/user/routes/profile"));
const invite_1 = __importDefault(require("../modules/user/routes/public/invite"));
const routes_7 = __importDefault(require("../modules/invite/routes"));
const profileCompletion_1 = __importDefault(require("../modules/user/routes/profileCompletion"));
const matchCount_1 = __importDefault(require("../modules/user/routes/matchCount"));
const stats_1 = __importDefault(require("../modules/user/routes/stats"));
const photos_1 = __importDefault(require("../modules/user/routes/photos"));
/* 🔥 NEW: PRIVATE PHOTO REQUESTS */
const photo_requests_1 = __importDefault(require("../modules/user/routes/photo.requests"));
/* 🔔 NOTIFICATIONS */
const notifications_1 = __importDefault(require("../modules/user/routes/notifications"));
/* 🔥 NEW: UPDATE USER */
const updateMe_1 = __importDefault(require("../modules/user/routes/updateMe"));
/* =========================
   VERIFICATION ROUTES
========================= */
const verification_1 = __importDefault(require("../modules/user/routes/verification"));
const selfieVerification_1 = __importDefault(require("../modules/user/routes/selfieVerification"));
/* =========================
   SETTINGS ROUTES
========================= */
const routes_8 = __importDefault(require("../modules/settings/routes"));
/* =========================
   ADMIN ROUTES
========================= */
const admin_dashboard_1 = __importDefault(require("../modules/admin/routes/admin.dashboard"));
const admin_invites_1 = __importDefault(require("../modules/admin/routes/admin.invites"));
const admin_users_1 = __importDefault(require("../modules/admin/routes/admin.users"));
const admin_system_1 = __importDefault(require("../modules/admin/routes/admin.system"));
const admin_roles_1 = __importDefault(require("../modules/admin/routes/admin.roles"));
const admin_bans_1 = __importDefault(require("../modules/admin/routes/admin.bans"));
const admin_swipe_1 = __importDefault(require("../modules/admin/routes/admin.swipe"));
const admin_matches_1 = __importDefault(require("../modules/admin/routes/admin.matches"));
const admin_verification_1 = __importDefault(require("../modules/admin/routes/admin.verification"));
const admin_messages_1 = __importDefault(require("../modules/admin/routes/admin.messages"));
const admin_settings_1 = __importDefault(require("../modules/admin/routes/admin.settings"));
const admin_analytics_1 = __importDefault(require("../modules/admin/routes/admin.analytics"));
const admin_online_1 = __importDefault(require("../modules/admin/routes/admin.online"));
/* 🔥 NEW: ADMIN SEARCH */
const admin_search_1 = __importDefault(require("../modules/admin/routes/admin.search"));
/* 🔥 NEW: ADMIN NOTIFICATIONS (FIX) */
const admin_notifications_1 = __importDefault(require("../modules/admin/routes/admin.notifications"));
/* =========================
   NEW: BLOCK & REPORT ROUTES
========================= */
const block_1 = __importDefault(require("../modules/user/routes/block"));
const report_1 = __importDefault(require("../modules/user/routes/report"));
/* =========================
   🔥 UPLOAD ROUTES
========================= */
const chatUpload_1 = __importDefault(require("../modules/upload/routes/chatUpload"));
const router = (0, express_1.Router)();
/* =========================
   AUTH DOMAIN
========================= */
router.use("/auth", routes_1.default);
/* =========================
   🔥 PUBLIC INVITE ROUTES
   MUST STAY ABOVE AUTH
========================= */
router.use("/invite", routes_7.default);
router.use("/invite", invite_1.default);
/* =========================
   AUTH PROTECTION
========================= */
router.use(requireUser_1.requireUser);
router.use(updateLastActive_1.updateLastActive);
/* =========================
   USER DOMAIN
========================= */
router.use("/onboarding", routes_2.default);
router.use("/user", routes_6.default);
router.use("/profile", profile_1.default);
/* 🔥 NEW: UPDATE USER (password + profile) */
router.use("/users", updateMe_1.default);
/* ✅ NEW ROUTES REGISTERED */
router.use("/block", block_1.default);
router.use("/report", report_1.default);
router.use("/user/photos", photos_1.default);
/* 🔥 NEW: PRIVATE PHOTO REQUESTS (MOUNTED HERE) */
router.use("/photo-access", photo_requests_1.default);
router.use("/user/profile-completion", profileCompletion_1.default);
router.use("/user/match-count", matchCount_1.default);
router.use("/user/swipe-stats", stats_1.default);
/* 🔔 NAVBAR NOTIFICATION BADGES */
router.use("/notifications", notifications_1.default);
/* =========================
   USER VERIFICATION
========================= */
router.use("/user/verify", verification_1.default);
router.use("/user/selfie-verification", selfieVerification_1.default);
/* =========================
   MATCHING DOMAIN
========================= */
router.use("/match", routes_3.default);
router.use("/discover", routes_4.default);
router.use("/swipe", routes_5.default);
/* =========================
   MESSAGING DOMAIN
========================= */
router.use("/conversations", conversations_1.default);
router.use("/messages", messages_1.default);
/* =========================
   UPLOAD DOMAIN
========================= */
router.use("/upload", chatUpload_1.default);
/* =========================
   SETTINGS DOMAIN
========================= */
router.use("/settings", routes_8.default);
/* =========================
   ADMIN DOMAIN
========================= */
router.use("/admin/dashboard", admin_dashboard_1.default);
router.use("/admin/users", admin_users_1.default);
router.use("/admin/invites", admin_invites_1.default);
router.use("/admin/system", admin_system_1.default);
router.use("/admin/roles", admin_roles_1.default);
router.use("/admin/bans", admin_bans_1.default);
router.use("/admin/swipe", admin_swipe_1.default);
router.use("/admin/matches", admin_matches_1.default);
router.use("/admin/verification", admin_verification_1.default);
/* 🔥 NEW: ADMIN SEARCH */
router.use("/admin/search", admin_search_1.default);
router.use("/admin/messages", admin_messages_1.default);
router.use("/admin/settings", admin_settings_1.default);
router.use("/admin/analytics", admin_analytics_1.default);
router.use("/admin/online", admin_online_1.default);
/* 🔥 FIX: ADMIN NOTIFICATIONS ROUTE (THIS WAS MISSING) */
router.use("/admin/notifications", admin_notifications_1.default);
exports.default = router;
