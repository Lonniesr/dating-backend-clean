"use strict";
// src/controllers/adminSystemTasksController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSystemTask = exports.getSystemTasks = void 0;
let tasks = [
    {
        id: "task_1",
        name: "Rebuild swipe queue",
        status: "idle",
        lastRunAt: null,
    },
    {
        id: "task_2",
        name: "Recalculate match scores",
        status: "idle",
        lastRunAt: null,
    },
];
const getSystemTasks = async (req, res) => {
    res.json({ tasks });
};
exports.getSystemTasks = getSystemTasks;
const runSystemTask = async (req, res) => {
    const { id } = req.params;
    tasks = tasks.map((t) => t.id === id
        ? {
            ...t,
            status: "completed",
            lastRunAt: new Date().toISOString(),
        }
        : t);
    res.json({ tasks });
};
exports.runSystemTask = runSystemTask;
