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
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { name, birthdate, gender, race, bio, birthplace, latitude, longitude, } = req.body;
        /* =========================
           VALIDATION
        ========================= */
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
        const parsedBirthdate = new Date(birthdate);
        if (isNaN(parsedBirthdate.getTime())) {
            return res.status(400).json({
                message: "Invalid birthdate format.",
            });
        }
        /* =========================
           AGE CALCULATION
        ========================= */
        const today = new Date();
        let age = today.getFullYear() - parsedBirthdate.getFullYear();
        const m = today.getMonth() - parsedBirthdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < parsedBirthdate.getDate())) {
            age--;
        }
        /* =========================
           UPDATE USER
        ========================= */
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                name: name.trim(),
                birthdate: parsedBirthdate,
                age,
                gender,
                race,
                bio: (bio === null || bio === void 0 ? void 0 : bio.trim()) || null,
                birthplace: (birthplace === null || birthplace === void 0 ? void 0 : birthplace.trim()) || null,
                latitude: latitude !== undefined && latitude !== null
                    ? Number(latitude)
                    : null,
                longitude: longitude !== undefined && longitude !== null
                    ? Number(longitude)
                    : null,
            },
            select: {
                id: true,
                name: true,
                birthdate: true,
                age: true,
                gender: true,
                race: true,
                bio: true,
                birthplace: true,
                latitude: true,
                longitude: true,
            },
        });
        return res.status(200).json({
            success: true,
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
