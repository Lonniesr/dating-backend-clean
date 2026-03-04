import { Router } from "express";

/* =========================
   USER ROUTES
========================= */

import authRoutes from "../modules/auth/routes";
import meRouter from "../modules/auth/routes/me";
import onboardingRoutes from "../modules/onboarding/routes";
import matchRoutes from "../modules/match/routes";
import messageRoutes from "../modules/messages/routes";
import discoverRoutes from "../modules/discover/routes";
import swipeRoutes from "../modules/swipe/routes";
import userRoutes from "../modules/user/routes";
import chatUploadRoute from "../modules/upload/routes/chatUploadRoute";
import publicInviteRoutes from "../modules/user/routes/public/invite"; // ✅ PUBLIC INVITE ROUTE

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
   AUTH
========================= */

router.use("/auth", authRoutes);
router.use("/me", meRouter);

/* =========================
   USER DOMAIN
========================= */

router.use("/onboarding", onboardingRoutes);
router.use("/user", userRoutes);
router.use("/invite", publicInviteRoutes); // ✅ FIXED (now /api/invite/:code works)
router.use("/upload/chat", chatUploadRoute);
router.use("/match", matchRoutes);
router.use("/messages", messageRoutes);
router.use("/discover", discoverRoutes);
router.use("/swipe", swipeRoutes);

/* =========================
   ADMIN DOMAIN
   Mounted at /api/admin/*
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