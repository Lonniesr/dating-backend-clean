import { Router } from "express";

import changePassword from "./changePassword";
import updateProfile from "./updateProfile";
import updateNotifications from "./updateNotifications";
import updateTheme from "./updateTheme";
import updatePreferences from "./preferences"; // ✅ add this
import deleteAccount from "./deleteAccount";
import logout from "../../auth/logout";

const router = Router();

/* =========================
   SETTINGS ROUTES
========================= */

router.use("/password", changePassword);
router.use("/profile", updateProfile);
router.use("/notifications", updateNotifications);
router.use("/theme", updateTheme);
router.use("/preferences", updatePreferences); // ✅ mount it
router.use("/delete", deleteAccount);
router.use("/logout", logout);

export default router;