import { Router } from "express";

/* =========================
   USER ROUTES
========================= */

import authRoutes from "../modules/auth/routes";
import onboardingRoutes from "../modules/onboarding/routes";
import matchRoutes from "../modules/match/routes";

/* 🔥 FIXED IMPORT */
import messageRoutes from "../modules/messages/routes/messages";

import conversationsRoutes from "../modules/messages/routes/conversations";
import discoverRoutes from "../modules/discover/routes";
import swipeRoutes from "../modules/swipe/routes";
import userRoutes from "../modules/user/routes";
import profileRoutes from "../modules/user/routes/profile";
import publicInviteRoutes from "../modules/user/routes/public/invite";
import inviteRoutes from "../modules/invite/routes";

import profileCompletionRoutes from "../modules/user/routes/profileCompletion";
import matchCountRoutes from "../modules/user/routes/matchCount";
import statsRoutes from "../modules/user/routes/stats";
import photosRouter from "../modules/user/routes/photos";

/* 🔔 NOTIFICATIONS */
import notificationsRoutes from "../modules/user/routes/notifications";

/* =========================
   VERIFICATION ROUTES
========================= */

import verificationRoutes from "../modules/user/routes/verification";
import selfieVerificationRoutes from "../modules/user/routes/selfieVerification";

/* =========================
   SETTINGS ROUTES
========================= */

import settingsRoutes from "../modules/settings/routes";

/* =========================
   ADMIN ROUTES
========================= */

import adminDashboardRoutes from "../modules/admin/routes/admin.dashboard";
import adminInvitesRoutes from "../modules/admin/routes/admin.invites";
import adminUsersRoutes from "../modules/admin/routes/admin.users";
import adminSystemRoutes from "../modules/admin/routes/admin.system";
import adminRolesRoutes from "../modules/admin/routes/admin.roles";
import adminBansRoutes from "../modules/admin/routes/admin.bans";
import adminSwipeRoutes from "../modules/admin/routes/admin.swipe";
import adminMatchesRoutes from "../modules/admin/routes/admin.matches";
import adminVerificationRoutes from "../modules/admin/routes/admin.verification";
import adminMessagesRoutes from "../modules/admin/routes/admin.messages";
import adminSettingsRoutes from "../modules/admin/routes/admin.settings";
import analyticsRouter from "../modules/admin/routes/admin.analytics";

/* 🔥 NEW: ADMIN SEARCH */
import adminSearchRoutes from "../modules/admin/routes/admin.search";

/* =========================
   NEW: BLOCK & REPORT ROUTES
========================= */

import blockRoutes from "../modules/user/routes/block";
import reportRoutes from "../modules/user/routes/report";

/* =========================
   🔥 UPLOAD ROUTES
========================= */

import chatUploadRoutes from "../modules/upload/routes/chatUpload";

const router = Router();

/* =========================
   AUTH DOMAIN
========================= */

router.use("/auth", authRoutes);

/* =========================
   USER DOMAIN
========================= */

router.use("/onboarding", onboardingRoutes);

router.use("/user", userRoutes);
router.use("/profile", profileRoutes);

/* ✅ NEW ROUTES REGISTERED */
router.use("/block", blockRoutes);
router.use("/report", reportRoutes);

router.use("/user/photos", photosRouter);
router.use("/user/profile-completion", profileCompletionRoutes);
router.use("/user/match-count", matchCountRoutes);
router.use("/user/swipe-stats", statsRoutes);

/* 🔔 NAVBAR NOTIFICATION BADGES */
router.use("/notifications", notificationsRoutes);

/* =========================
   USER VERIFICATION
========================= */

router.use("/user/verify", verificationRoutes);
router.use("/user/selfie-verification", selfieVerificationRoutes);

/* =========================
   INVITE SYSTEM
========================= */

router.use("/invite", inviteRoutes);
router.use("/invite", publicInviteRoutes);

/* =========================
   MATCHING DOMAIN
========================= */

router.use("/match", matchRoutes);
router.use("/discover", discoverRoutes);
router.use("/swipe", swipeRoutes);

/* =========================
   MESSAGING DOMAIN
========================= */

router.use("/conversations", conversationsRoutes);
router.use("/messages", messageRoutes);

/* =========================
   UPLOAD DOMAIN
========================= */

router.use("/upload", chatUploadRoutes);

/* =========================
   SETTINGS DOMAIN
========================= */

router.use("/settings", settingsRoutes);

/* =========================
   ADMIN DOMAIN
========================= */

router.use("/admin/dashboard", adminDashboardRoutes);
router.use("/admin/users", adminUsersRoutes);
router.use("/admin/invites", adminInvitesRoutes);
router.use("/admin/system", adminSystemRoutes);
router.use("/admin/roles", adminRolesRoutes);
router.use("/admin/bans", adminBansRoutes);
router.use("/admin/swipe", adminSwipeRoutes);
router.use("/admin/matches", adminMatchesRoutes);
router.use("/admin/verification", adminVerificationRoutes);

/* 🔥 NEW: ADMIN SEARCH */
router.use("/admin/search", adminSearchRoutes);

router.use("/admin/messages", adminMessagesRoutes);
router.use("/admin/settings", adminSettingsRoutes);
router.use("/admin/analytics", analyticsRouter);

export default router;