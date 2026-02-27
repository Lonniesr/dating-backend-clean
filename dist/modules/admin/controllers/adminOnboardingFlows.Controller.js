"use strict";
// src/controllers/adminOnboardingFlowsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOnboardingStep = exports.getOnboardingFlows = void 0;
let steps = [
    { id: "step_1", title: "Basic Info", enabled: true, order: 1 },
    { id: "step_2", title: "Photos", enabled: true, order: 2 },
    { id: "step_3", title: "Preferences", enabled: true, order: 3 },
];
const getOnboardingFlows = async (req, res) => {
    res.json({ steps });
};
exports.getOnboardingFlows = getOnboardingFlows;
const updateOnboardingStep = async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    steps = steps.map((s) => (s.id === id ? { ...s, ...body } : s));
    res.json({ steps });
};
exports.updateOnboardingStep = updateOnboardingStep;
