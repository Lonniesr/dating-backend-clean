import { Router } from "express";

import basic from "./basic";
import photos from "./photos";
import preferences from "./preferences";
import personality from "./personality";
import complete from "./complete";

const router = Router();

router.use("/basic", basic);
router.use("/photos", photos);
router.use("/preferences", preferences);
router.use("/personality", personality);
router.use("/complete", complete);

export default router;
