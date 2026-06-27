import { Router } from "express";

import loginRouter from "./login";
import registerRouter from "./register";
import signupRouter from "./signup";
import meRouter from "./me";
import logoutRouter from "../logout";

// NEW
import forgotPasswordRouter from "./forgotPassword";
import resetPasswordRouter from "./resetPassword";

const router = Router();

router.use("/login", loginRouter);
router.use("/register", registerRouter);
router.use("/signup", signupRouter);

router.use("/forgot-password", forgotPasswordRouter);
router.use("/reset-password", resetPasswordRouter);

// ✅ FIXED
router.use("/", meRouter);

router.use("/logout", logoutRouter);

export default router;