import { Router } from "express";
import { onlineUsers } from "../../../sockets/chat.socket";
const router = Router();

router.get("/", (_req, res) => {
    console.log("📡 ADMIN ONLINE ROUTE:", Array.from(onlineUsers));
  res.json({
    online: Array.from(onlineUsers),
  });
});

export default router;