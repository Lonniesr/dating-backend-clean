"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../../prisma"));
const router = (0, express_1.Router)();
/**
 * GET /api/invite/:code
 * Public invite validation + scan tracking
 */
router.get("/:code", async (req, res) => {
    try {
        const code = req.params.code;
        if (!code) {
            return res.status(400).json({ error: "Invite code required" });
        }
        const invite = await prisma_1.default.invite.findUnique({
            where: { code },
        });
        if (!invite) {
            return res.status(404).json({ error: "Invite not found" });
        }
        /* =========================
           SAFE STRING NORMALIZATION
        ========================= */
        const userAgentHeader = req.headers["user-agent"];
        const userAgent = typeof userAgentHeader === "string"
            ? userAgentHeader
            : "";
        const ipAddress = typeof req.ip === "string"
            ? req.ip
            : "";
        /* =========================
           BASIC DEVICE DETECTION
        ========================= */
        let device = "desktop";
        if (/mobile/i.test(userAgent))
            device = "mobile";
        if (/tablet/i.test(userAgent))
            device = "tablet";
        /* =========================
           TRACK SCAN
        ========================= */
        await prisma_1.default.inviteScan.create({
            data: {
                inviteId: invite.id,
                device,
                browser: null,
                os: null,
                ip: ipAddress || null,
            },
        });
        /* =========================
           INCREMENT SCAN COUNTER
        ========================= */
        const updatedInvite = await prisma_1.default.invite.update({
            where: { id: invite.id },
            data: {
                scanCount: { increment: 1 },
            },
        });
        /* =========================
           VALIDATION
        ========================= */
        if (updatedInvite.used) {
            return res.status(400).json({
                error: "Invite already used",
                scanCount: updatedInvite.scanCount,
            });
        }
        if (updatedInvite.expiresAt &&
            updatedInvite.expiresAt < new Date()) {
            return res.status(410).json({
                error: "Invite expired",
                expiresAt: updatedInvite.expiresAt,
                scanCount: updatedInvite.scanCount,
            });
        }
        return res.json({
            valid: true,
            code: updatedInvite.code,
            premium: updatedInvite.premium,
            expiresAt: updatedInvite.expiresAt,
            used: updatedInvite.used,
            scanCount: updatedInvite.scanCount,
        });
    }
    catch (error) {
        console.error("Public invite lookup error:", error);
        return res.status(500).json({
            error: "Failed to validate invite",
        });
    }
});
exports.default = router;
