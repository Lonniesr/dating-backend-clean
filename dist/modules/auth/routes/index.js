"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const login_1 = __importDefault(require("./login")); // ✅ FIXED (was pointing to admin)
const register_1 = __importDefault(require("./register"));
const signup_1 = __importDefault(require("./signup"));
const me_1 = __importDefault(require("./me"));
const logout_1 = __importDefault(require("../logout"));
const router = (0, express_1.Router)();
router.use("/login", login_1.default);
router.use("/register", register_1.default);
router.use("/signup", signup_1.default);
router.use("/me", me_1.default);
router.use("/logout", logout_1.default);
exports.default = router;
