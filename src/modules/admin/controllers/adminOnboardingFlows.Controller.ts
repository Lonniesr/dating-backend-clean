// src/controllers/adminOnboardingFlowsController.ts

import { Request, Response } from "express";

type OnboardingStep = {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
};

let steps: OnboardingStep[] = [
  { id: "step_1", title: "Basic Info", enabled: true, order: 1 },
  { id: "step_2", title: "Photos", enabled: true, order: 2 },
  { id: "step_3", title: "Preferences", enabled: true, order: 3 },
];

export const getOnboardingFlows = async (req: Request, res: Response) => {
  res.json({ steps });
};

export const updateOnboardingStep = async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  steps = steps.map((s) => (s.id === id ? { ...s, ...body } : s));

  res.json({ steps });
};