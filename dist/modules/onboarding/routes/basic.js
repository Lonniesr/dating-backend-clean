"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../../prisma"));
const requireUser_1 = require("../../../middleware/requireUser");
const router = (0, express_1.Router)();
router.post("/", requireUser_1.requireUser, async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { name, birthdate, gender, race } = req.body;
        // ----- Validation -----
        if (!name || !birthdate || !gender || !race) {
            return res.status(400).json({
                message: "Name, birthdate, gender, and race are required.",
            });
        }
        const validRaces = [
            "Black",
            "White",
            "Asian",
            "Latino",
            "Middle Eastern",
            "Mixed",
            "Other",
        ];
        if (!validRaces.includes(race)) {
            return res.status(400).json({
                message: "Invalid race value.",
            });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                name: name.trim(),
                birthdate: new Date(birthdate),
                gender,
                race,
            },
        });
        return res.status(200).json({
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("ONBOARDING BASIC ERROR:", error);
        return res.status(500).json({
            error: "Failed to update basic info",
        });
    }
});
exports.default = router;
