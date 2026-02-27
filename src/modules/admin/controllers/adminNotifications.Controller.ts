// src/controllers/adminNotificationsController.ts

import { Request, Response } from "express";

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

export const getNotificationTemplates = async (req: Request, res: Response) => {
  res.json({ templates });
};

export const sendTestNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ ok: true, id });
};