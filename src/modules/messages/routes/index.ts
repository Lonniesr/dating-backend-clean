import { Router } from "express";
import getMessages from "./getMessages";
import sendMessage from "./sendMessage";
import getConversations from "./getConversations";
import { requireUser } from "../../../middleware/requireUser";

const router = Router();

/* GET inbox conversations */
router.get("/", requireUser, getConversations);

/* GET conversation messages */
router.get("/:conversationId", requireUser, getMessages);

/* SEND message */
router.post("/:conversationId", requireUser, sendMessage);

export default router;