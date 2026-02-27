"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Temporary test route
router.get("/", (req, res) => {
    res.json({ message: "Match routes working" });
});
exports.default = router;
