import { Router } from "express";
import { onlineUsers } from "../../../sockets/chat.socket";
const router = Router();

router.get("/", (_req, res) => {
  res.json({
    online: Array.from(onlineUsers),
  });
});

export default router;