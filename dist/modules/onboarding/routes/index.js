"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const basic_1 = __importDefault(require("./basic"));
const photos_1 = __importDefault(require("./photos"));
const personality_1 = __importDefault(require("./personality"));
const complete_1 = __importDefault(require("./complete"));
const router = (0, express_1.Router)();
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
router.use("/basic", basic_1.default);
router.use("/photos", photos_1.default);
router.use("/personality", personality_1.default);
router.use("/complete", complete_1.default);
exports.default = router;
