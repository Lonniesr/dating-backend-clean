"use strict";
// src/controllers/adminEmailsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmail = exports.getEmailTemplates = void 0;
let templates = [
    {
        id: "email_1",
        subject: "Welcome to LynQ",
        body: "We’re glad you’re here. Let’s get you connected.",
    },
    {
        id: "email_2",
        subject: "Password reset",
        body: "Click the link below to reset your password.",
    },
];
const getEmailTemplates = async (req, res) => {
    res.json({ templates });
};
exports.getEmailTemplates = getEmailTemplates;
const sendTestEmail = async (req, res) => {
    const { id } = req.params;
    const { to } = req.body;
    res.json({ ok: true, id, to });
};
exports.sendTestEmail = sendTestEmail;
