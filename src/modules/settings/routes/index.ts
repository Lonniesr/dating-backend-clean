import { Router } from "express";

import changePassword from "./changePassword";
import updateProfile from "./updateProfile";
import updateNotifications from "./updateNotifications";
import updateTheme from "./updateTheme";
import deleteAccount from "./deleteAccount";
import logout from "../../auth/logout";
const router = Router();

router.use("/password", changePassword);
router.use("/profile", updateProfile);
router.use("/notifications", updateNotifications);
router.use("/theme", updateTheme);
router.use("/delete", deleteAccount);
router.use("/logout", logout);

export default router;
