// src/controllers/adminSystemTasksController.ts

import { Request, Response } from "express";

let tasks = [
  {
    id: "task_1",
    name: "Rebuild swipe queue",
    status: "idle",
    lastRunAt: null as string | null,
  },
  {
    id: "task_2",
    name: "Recalculate match scores",
    status: "idle",
    lastRunAt: null as string | null,
  },
];

export const getSystemTasks = async (req: Request, res: Response) => {
  res.json({ tasks });
};

export const runSystemTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  tasks = tasks.map((t) =>
    t.id === id
      ? {
          ...t,
          status: "completed",
          lastRunAt: new Date().toISOString(),
        }
      : t
  );

  res.json({ tasks });
};