// src/controllers/adminExperimentsController.ts

import { Request, Response } from "express";

let experiments = [
  {
    id: "exp_1",
    name: "New Onboarding Flow",
    key: "onboarding_v2",
    status: "running",
    variantA: "Control",
    variantB: "New Flow",
  },
  {
    id: "exp_2",
    name: "Swipe Deck Layout",
    key: "swipe_layout_test",
    status: "paused",
    variantA: "Classic",
    variantB: "Stacked Cards",
  },
];

export const getExperiments = async (req: Request, res: Response) => {
  res.json({ experiments });
};

export const updateExperimentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  experiments = experiments.map((e) =>
    e.id === id ? { ...e, status: status || e.status } : e
  );

  res.json({ ok: true });
};