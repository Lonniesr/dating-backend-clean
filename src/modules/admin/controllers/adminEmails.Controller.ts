// src/controllers/adminEmailsController.ts

import { Request, Response } from "express";

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

export const getEmailTemplates = async (req: Request, res: Response) => {
  res.json({ templates });
};

export const sendTestEmail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { to } = req.body;
  res.json({ ok: true, id, to });
};