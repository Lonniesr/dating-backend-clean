"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const env_1 = require("../../config/env");
const router = (0, express_1.Router)();
router.post("/", (_req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === "production",
        sameSite: env_1.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    });
    return res.json({ ok: true });
});
exports.default = router;
