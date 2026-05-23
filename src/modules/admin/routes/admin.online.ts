import { Router } from "express";
import { onlineUsers } from "../../../server";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    online: Array.from(onlineUsers),
  });
});

export default router;