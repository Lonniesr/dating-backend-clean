"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const changePassword_1 = __importDefault(require("./changePassword"));
const updateProfile_1 = __importDefault(require("./updateProfile"));
const updateNotifications_1 = __importDefault(require("./updateNotifications"));
const updateTheme_1 = __importDefault(require("./updateTheme"));
const preferences_1 = __importDefault(require("./preferences")); // ✅ add this
const deleteAccount_1 = __importDefault(require("./deleteAccount"));
const logout_1 = __importDefault(require("../../auth/logout"));
const router = (0, express_1.Router)();
/* =========================
   SETTINGS ROUTES
========================= */
router.use("/password", changePassword_1.default);
router.use("/profile", updateProfile_1.default);
router.use("/notifications", updateNotifications_1.default);
router.use("/theme", updateTheme_1.default);
router.use("/preferences", preferences_1.default); // ✅ mount it
router.use("/delete", deleteAccount_1.default);
router.use("/logout", logout_1.default);
exports.default = router;
