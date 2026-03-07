import { Router } from "express";

/* =========================
   USER ROUTES
========================= */

import authRoutes from "../modules/auth/routes";
import onboardingRoutes from "../modules/onboarding/routes";
import matchRoutes from "../modules/match/routes";
import messageRoutes from "../modules/messages/routes";
import conversationsRoutes from "../modules/messages/routes/conversations";
import discoverRoutes from "../modules/discover/routes";
import swipeRoutes from "../modules/swipe/routes";
import userRoutes from "../modules/user/routes";
import chatUploadRoute from "../modules/upload/routes/chatUploadRoute";
import publicInviteRoutes from "../modules/user/routes/public/invite";

import profileCompletionRoutes from "../modules/user/routes/profileCompletion";
import matchCountRoutes from "../modules/user/routes/matchCount";
import statsRoutes from "../modules/user/routes/stats";
import photosRouter from "../modules/user/routes/photos";

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

const router = Router();

/* =========================
   AUTH DOMAIN
========================= */

router.use("/auth", authRoutes);

/* =========================
   USER DOMAIN
========================= */

router.use("/onboarding", onboardingRoutes);

// Core user routes
router.use("/user", userRoutes);
router.use("/user/photos", photosRouter);
router.use("/user/profile-completion", profileCompletionRoutes);
router.use("/user/match-count", matchCountRoutes);
router.use("/user/swipe-stats", statsRoutes);

// Public + utilities
router.use("/invite", publicInviteRoutes);
router.use("/upload/chat", chatUploadRoute);

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
router.use("/admin/messages", adminMessagesRoutes);
router.use("/admin/settings", adminSettingsRoutes);
router.use("/admin/analytics", analyticsRouter);

export default router;