"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireAdmin_1 = require("../../../middleware/requireAdmin");
const router = (0, express_1.Router)();
/**
 * GET /api/admin/matches
 */
router.get("/", requireAdmin_1.requireAdmin, async (_req, res) => {
    try {
        const matches = await prisma_1.default.match.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json({ matches });
    }
    catch (err) {
        console.error("ADMIN MATCHES ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
