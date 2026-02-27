// src/controllers/adminEmailMonitorController.ts

import { Request, Response } from "express";

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

export const getEmailMonitorData = async (req: Request, res: Response) => {
  res.json({
    recent,
    bounces,
    templates,
  });
};

export const retryBounce = async (req: Request, res: Response) => {
  const { id } = req.params;

  bounces = bounces.filter((b) => b.id !== id);

  res.json({ ok: true });
};