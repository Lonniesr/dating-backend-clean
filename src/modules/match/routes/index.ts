import { Router } from "express";

import matchRoutes from "./match";

const router = Router();

router.use(matchRoutes);

export default router;