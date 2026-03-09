import { Router } from "express";

import basicRoutes from "./basic";
import photosRoutes from "./photos";
import preferencesRoutes from "./preferences";
import personalityRoutes from "./personality";
import completeRoutes from "./complete";

const router = Router();

/**
 * ONBOARDING ROUTES
 *
 * Base path: /api/onboarding
 *
 * Endpoints:
 * POST /api/onboarding/basic
 * POST /api/onboarding/photos
 * POST /api/onboarding/preferences
 * POST /api/onboarding/personality
 * POST /api/onboarding/complete
 */

router.use("/basic", basicRoutes);
router.use("/photos", photosRoutes);
router.use("/preferences", preferencesRoutes);
router.use("/personality", personalityRoutes);
router.use("/complete", completeRoutes);

export default router;