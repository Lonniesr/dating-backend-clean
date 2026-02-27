"use strict";
// src/modules/invite/routes/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "Invite route working" });
});
exports.default = router;
