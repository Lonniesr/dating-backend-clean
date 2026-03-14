import { Router } from "express";
import getMessages from "./getMessages";
import sendMessage from "./sendMessage";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/* GET conversation messages */
router.get("/:conversationId", requireUser, getMessages);

/* SEND message */
router.post("/:conversationId", requireUser, sendMessage);

/* Health check */
router.get("/", (req, res) => {
  res.json({ message: "Messages routes working" });
});

export default router;