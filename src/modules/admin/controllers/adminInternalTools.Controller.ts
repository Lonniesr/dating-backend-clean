// src/controllers/adminInternalToolsController.ts

import { Request, Response } from "express";

export const resetUserState = async (req: Request, res: Response) => {
  const { userId } = req.body;
  res.json({ message: `User ${userId} state reset.` });
};

export const forceMatchForUser = async (req: Request, res: Response) => {
  const { userId } = req.body;
  res.json({ message: `Forced match created for user ${userId}.` });
};