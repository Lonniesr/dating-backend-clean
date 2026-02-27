// src/controllers/adminContentController.ts

import { Request, Response } from "express";

type ContentItem = {
  id: string;
  title: string;
  type: "prompt" | "copy" | "system";
  body: string;
};

let items: ContentItem[] = [
  {
    id: "content_1",
    title: "Welcome message",
    type: "copy",
    body: "Welcome to LynQ — where connections feel intentional.",
  },
];

export const getContentItems = async (req: Request, res: Response) => {
  res.json({ items });
};

export const createContentItem = async (req: Request, res: Response) => {
  const { title, body } = req.body;

  const item: ContentItem = {
    id: `content_${Date.now()}`,
    title,
    type: "prompt",
    body,
  };

  items = [item, ...items];

  res.json({ items });
};