// src/controllers/adminFeatureRolloutsController.ts

import { Request, Response } from "express";

let featureFlags = [
  {
    id: "flag_1",
    key: "new_swipe_deck",
    name: "New Swipe Deck",
    description: "Enables the experimental swipe deck experience.",
    enabled: true,
    rolloutPercentage: 50,
  },
  {
    id: "flag_2",
    key: "priority_matching",
    name: "Priority Matching",
    description: "Boosts match frequency for selected cohorts.",
    enabled: false,
    rolloutPercentage: 0,
  },
];

export const getFeatureRollouts = async (req: Request, res: Response) => {
  res.json({ flags: featureFlags });
};

export const updateFeatureRollout = async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  featureFlags = featureFlags.map((f) => (f.id === id ? { ...f, ...body } : f));

  res.json({ ok: true });
};