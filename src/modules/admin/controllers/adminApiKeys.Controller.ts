// src/controllers/adminApiKeysController.ts

import { Request, Response } from "express";
import crypto from "crypto";

type ApiKey = {
  id: string;
  label: string;
  keyPreview: string;
  createdAt: string;
  revoked: boolean;
};

let keys: ApiKey[] = [];

export const getApiKeys = async (req: Request, res: Response) => {
  res.json({ keys });
};

export const createApiKey = async (req: Request, res: Response) => {
  const id = `key_${Date.now()}`;
  const raw = crypto.randomBytes(16).toString("hex");
  const keyPreview = `${raw.slice(0, 4)}••••••${raw.slice(-4)}`;

  const key: ApiKey = {
    id,
    label: `Key ${keys.length + 1}`,
    keyPreview,
    createdAt: new Date().toISOString(),
    revoked: false,
  };

  keys = [key, ...keys];

  res.json({ keys });
};

export const revokeApiKey = async (req: Request, res: Response) => {
  const { id } = req.params;

  keys = keys.map((k) =>
    k.id === id
      ? {
          ...k,
          revoked: true,
        }
      : k
  );

  res.json({ keys });
};