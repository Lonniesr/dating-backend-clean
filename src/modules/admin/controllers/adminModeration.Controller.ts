// src/controllers/adminModerationController.ts

import { Request, Response } from "express";

export const getModerationQueue = async (req: Request, res: Response) => {
  try {
    const items = [
      {
        id: "user_123",
        name: "John Doe",
        reason: "Inappropriate photos",
        createdAt: new Date().toISOString(),
      },
      {
        id: "user_456",
        name: "Sarah Smith",
        reason: "Harassment report",
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({ items });
  } catch (err) {
    console.error("Moderation error:", err);
    res.status(500).json({ error: "Failed to load moderation queue" });
  }
};

export const approveModerationItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("Approved moderation item:", id);

  res.json({ ok: true });
};

export const rejectModerationItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log("Rejected moderation item:", id);

  res.json({ ok: true });
};