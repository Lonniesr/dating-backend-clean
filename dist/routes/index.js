"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
/* =========================
   USER ROUTES
========================= */
const routes_1 = __importDefault(require("../modules/auth/routes"));
const me_1 = __importDefault(require("../modules/auth/routes/me"));
const routes_2 = __importDefault(require("../modules/onboarding/routes"));
const routes_3 = __importDefault(require("../modules/match/routes"));
const routes_4 = __importDefault(require("../modules/messages/routes"));
const routes_5 = __importDefault(require("../modules/discover/routes"));
const routes_6 = __importDefault(require("../modules/swipe/routes"));
const routes_7 = __importDefault(require("../modules/user/routes"));
const chatUploadRoute_1 = __importDefault(require("../modules/upload/routes/chatUploadRoute"));
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
const router = (0, express_1.Router)();
/* =========================
   AUTH
========================= */
router.use("/auth", routes_1.default);
/**
 * GET /api/me
 */
router.use("/me", me_1.default);
/* =========================
   USER DOMAIN
========================= */
router.use("/onboarding", routes_2.default);
router.use("/user", routes_7.default);
router.use("/upload/chat", chatUploadRoute_1.default);
router.use("/match", routes_3.default);
router.use("/messages", routes_4.default);
router.use("/discover", routes_5.default);
router.use("/swipe", routes_6.default);
/* =========================
   ADMIN DOMAIN
   Mounted at /api/admin/*
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
router.use("/admin/messages", admin_messages_1.default);
router.use("/admin/settings", admin_settings_1.default);
/* =========================
   EXPORT
========================= */
exports.default = router;
