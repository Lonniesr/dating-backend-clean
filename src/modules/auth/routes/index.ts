import { Router } from "express";

import loginRouter from "./login";
import registerRouter from "./register";
import signupRouter from "./signup";
import meRouter from "./me";
import logoutRouter from "../logout";

const router = Router();

router.use("/login", loginRouter);
router.use("/register", registerRouter);
router.use("/signup", signupRouter);

// ✅ FIXED
router.use("/", meRouter);

router.use("/logout", logoutRouter);

export default router;