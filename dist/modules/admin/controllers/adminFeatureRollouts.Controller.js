"use strict";
// src/controllers/adminFeatureRolloutsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeatureRollout = exports.getFeatureRollouts = void 0;
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
const getFeatureRollouts = async (req, res) => {
    res.json({ flags: featureFlags });
};
exports.getFeatureRollouts = getFeatureRollouts;
const updateFeatureRollout = async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    featureFlags = featureFlags.map((f) => (f.id === id ? { ...f, ...body } : f));
    res.json({ ok: true });
};
exports.updateFeatureRollout = updateFeatureRollout;
