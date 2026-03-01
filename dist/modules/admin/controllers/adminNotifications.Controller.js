"use strict";
// src/controllers/adminNotificationsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = exports.getNotificationTemplates = void 0;
let templates = [
    {
        id: "notif_1",
        title: "New match",
        body: "You have a new match waiting in LynQ.",
    },
    {
        id: "notif_2",
        title: "Profile boost",
        body: "Your profile is being boosted for the next 24 hours.",
    },
];
const getNotificationTemplates = async (req, res) => {
    res.json({ templates });
};
exports.getNotificationTemplates = getNotificationTemplates;
const sendTestNotification = async (req, res) => {
    const { id } = req.params;
    res.json({ ok: true, id });
};
exports.sendTestNotification = sendTestNotification;
