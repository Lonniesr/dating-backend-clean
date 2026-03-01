"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireUser_1 = require("../../../middleware/requireUser");
const prisma_1 = __importDefault(require("../../../prisma"));
const router = (0, express_1.Router)();
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;
        if (!preferences) {
            return res.status(400).json({ error: "Preferences required" });
        }
        let { interestedIn, racePreference, minAge, maxAge, locationRadius, } = preferences;
        // ----- Basic Validation -----
        if (!interestedIn || typeof interestedIn !== "string") {
            return res.status(400).json({ error: "InterestedIn is required" });
        }
        minAge = Number(minAge);
        maxAge = Number(maxAge);
        if (Number.isNaN(minAge) ||
            Number.isNaN(maxAge) ||
            minAge < 18 ||
            maxAge > 100 ||
            minAge >= maxAge) {
            return res.status(400).json({ error: "Invalid age range" });
        }
        // Allow null radius (means "any")
        if (locationRadius !== null) {
            locationRadius = Number(locationRadius);
            if (Number.isNaN(locationRadius) ||
                locationRadius < 5 ||
                locationRadius > 100) {
                return res.status(400).json({ error: "Invalid location radius" });
            }
        }
        // ----- Update Safely -----
        const existing = req.user.preferences || {};
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                preferences: {
                    ...existing, // preserve future fields
                    interestedIn,
                    racePreference: racePreference || null,
                    minAge,
                    maxAge,
                    locationRadius: locationRadius !== null && locationRadius !== void 0 ? locationRadius : null,
                },
            },
        });
        return res.json({ user: updated });
    }
    catch (err) {
        console.error("PREFERENCES UPDATE ERROR:", err);
        return res.status(500).json({ error: "Failed to update preferences" });
    }
});
exports.default = router;
