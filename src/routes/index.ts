import { Router } from "express";

import authRoutes from "../modules/auth/routes";
import meRouter from "../modules/auth/routes/me";
import adminLoginRouter from "../modules/admin/routes/login"; // ✅ admin login

import onboardingRoutes from "../modules/onboarding/routes";
// import inviteRoutes from "../modules/invite/routes";
import matchRoutes from "../modules/match/routes";
import messageRoutes from "../modules/messages/routes";
import discoverRoutes from "../modules/discover/routes";
import swipeRoutes from "../modules/swipe/routes";
import userRoutes from "../modules/user/routes";
import chatUploadRoute from "../modules/upload/routes/chatUploadRoute";

const router = Router();

/**
 * USER AUTH
 * Creates:
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   POST /api/auth/register
 *   GET  /api/auth/me
 */
router.use("/auth", authRoutes);

/**
 * ADMIN AUTH
 * Creates:
 *   POST /api/admin/login
 */
router.use("/admin/login", adminLoginRouter);

/**
 * CURRENT USER (frontend compatibility)
 * Creates:
 *   GET /api/me
 */
router.use("/me", meRouter);

/**
 * USER + ONBOARDING
 */
router.use("/onboarding", onboardingRoutes);
// router.use("/invite", inviteRoutes);
router.use("/user", userRoutes);

/**
 * UPLOADS (Chat Media)
 */
router.use("/upload/chat", chatUploadRoute);

/**
 * MATCHING + MESSAGING
 */
router.use("/match", matchRoutes);
router.use("/messages", messageRoutes);

/**
 * DISCOVER + SWIPE
 */
router.use("/discover", discoverRoutes);
router.use("/swipe", swipeRoutes);

export default router;