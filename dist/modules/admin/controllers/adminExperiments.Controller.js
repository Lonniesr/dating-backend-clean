"use strict";
// src/controllers/adminExperimentsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExperimentStatus = exports.getExperiments = void 0;
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
const getExperiments = async (req, res) => {
    res.json({ experiments });
};
exports.getExperiments = getExperiments;
const updateExperimentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    experiments = experiments.map((e) => e.id === id ? { ...e, status: status || e.status } : e);
    res.json({ ok: true });
};
exports.updateExperimentStatus = updateExperimentStatus;
