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
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { preferences } = req.body;
        if (!preferences || typeof preferences !== "object") {
            return res.status(400).json({ error: "Preferences required" });
        }
        let { interestedIn, racePreference, minAge, maxAge, locationRadius, } = preferences;
        /* ==============================
           VALIDATION
        ============================== */
        if (!interestedIn || typeof interestedIn !== "string") {
            return res.status(400).json({
                error: "interestedIn is required",
            });
        }
        minAge = Number(minAge);
        maxAge = Number(maxAge);
        if (Number.isNaN(minAge) ||
            Number.isNaN(maxAge) ||
            minAge < 18 ||
            maxAge > 100 ||
            minAge >= maxAge) {
            return res.status(400).json({
                error: "Invalid age range",
            });
        }
        if (locationRadius !== null && locationRadius !== undefined) {
            locationRadius = Number(locationRadius);
            if (Number.isNaN(locationRadius) ||
                locationRadius < 5 ||
                locationRadius > 100) {
                return res.status(400).json({
                    error: "Invalid location radius",
                });
            }
        }
        else {
            locationRadius = null;
        }
        /* ==============================
           LOAD EXISTING PREFERENCES
        ============================== */
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { preferences: true },
        });
        if (!currentUser) {
            return res.status(404).json({
                error: "User not found",
            });
        }
        const existingPreferences = currentUser.preferences &&
            typeof currentUser.preferences === "object"
            ? currentUser.preferences
            : {};
        /* ==============================
           UPDATE USER
        ============================== */
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                preferences: {
                    ...existingPreferences,
                    interestedIn,
                    racePreference: racePreference || null,
                    minAge,
                    maxAge,
                    locationRadius,
                },
            },
            select: {
                id: true,
                preferences: true,
            },
        });
        return res.json({
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("PREFERENCES UPDATE ERROR:", err);
        return res.status(500).json({
            error: "Failed to update preferences",
        });
    }
});
exports.default = router;
