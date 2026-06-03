"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const swipe_1 = __importDefault(require("./swipe"));
const likesYou_1 = __importDefault(require("./likesYou"));
const swipeStats_1 = __importDefault(require("./swipeStats"));
const router = (0, express_1.Router)();
/* Health check */
router.get("/", (_req, res) => {
    res.json({ message: "Swipe routes working" });
});
/* Core swipe action */
router.use("/", swipe_1.default);
/* Swipe statistics */
router.use("/stats", swipeStats_1.default);
/* People who liked you */
router.use("/", likesYou_1.default);
exports.default = router;
