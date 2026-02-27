import { Router } from "express";

import loginRouter from "./login"; // ✅ FIXED (was pointing to admin)
import registerRouter from "./register";
import signupRouter from "./signup";
import meRouter from "./me";
import logoutRouter from "../logout";

const router = Router();

router.use("/login", loginRouter);
router.use("/register", registerRouter);
router.use("/signup", signupRouter);
router.use("/me", meRouter);
router.use("/logout", logoutRouter);

export default router;