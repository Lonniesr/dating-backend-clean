"use strict";
// src/controllers/adminEmailMonitorController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryBounce = exports.getEmailMonitorData = void 0;
let recent = [
    {
        id: "em_001",
        user: "Ava Carter",
        subject: "Welcome to LynQ!",
        provider: "SendGrid",
        status: "delivered",
        time: "4m ago",
    },
    {
        id: "em_002",
        user: "Noah Reyes",
        subject: "Verify your email",
        provider: "Postmark",
        status: "opened",
        time: "12m ago",
    },
];
let bounces = [
    {
        id: "bn_001",
        user: "Unknown",
        subject: "Password Reset",
        provider: "SendGrid",
        reason: "Mailbox full",
        time: "1h ago",
    },
    {
        id: "bn_002",
        user: "Liam Brooks",
        subject: "Weekly Recap",
        provider: "Mailgun",
        reason: "Invalid address",
        time: "3h ago",
    },
];
let templates = [
    {
        id: "tpl_001",
        name: "Welcome Email",
        sent: 12400,
        openRate: "62%",
        clickRate: "18%",
    },
    {
        id: "tpl_002",
        name: "Match Notification",
        sent: 84200,
        openRate: "48%",
        clickRate: "12%",
    },
];
const getEmailMonitorData = async (req, res) => {
    res.json({
        recent,
        bounces,
        templates,
    });
};
exports.getEmailMonitorData = getEmailMonitorData;
const retryBounce = async (req, res) => {
    const { id } = req.params;
    bounces = bounces.filter((b) => b.id !== id);
    res.json({ ok: true });
};
exports.retryBounce = retryBounce;
