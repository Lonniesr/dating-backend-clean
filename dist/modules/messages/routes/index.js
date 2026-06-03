"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const getMessages_1 = __importDefault(require("./getMessages"));
const sendMessage_1 = __importDefault(require("./sendMessage"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
/* GET conversation messages */
router.get("/:conversationId", requireUser_1.requireUser, getMessages_1.default);
/* SEND message */
router.post("/:conversationId", requireUser_1.requireUser, sendMessage_1.default);
/* Health check */
router.get("/", (req, res) => {
    res.json({ message: "Messages routes working" });
});
exports.default = router;
