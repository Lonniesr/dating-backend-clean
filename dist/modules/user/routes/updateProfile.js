"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateProfile;
const prisma_1 = __importDefault(require("../../../prisma"));
async function updateProfile(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { name, username, birthdate, gender, bio, birthplace, location, } = req.body;
        /* ===============================
           BUILD SAFE UPDATE OBJECT
        =============================== */
        const data = {};
        if (typeof name === "string")
            data.name = name.trim();
        if (typeof username === "string")
            data.username = username.trim();
        if (birthdate) {
            const parsed = new Date(birthdate);
            if (!isNaN(parsed.getTime())) {
                data.birthdate = parsed;
            }
        }
        if (typeof gender === "string")
            data.gender = gender;
        if (typeof bio === "string") {
            data.bio = bio.trim() || null;
        }
        if (typeof birthplace === "string") {
            data.birthplace = birthplace.trim() || null;
        }
        if (typeof location === "string") {
            data.location = location.trim() || null;
        }
        /* ===============================
           UPDATE USER
        =============================== */
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                birthdate: true,
                gender: true,
                bio: true,
                birthplace: true,
                location: true,
                preferences: true,
                photos: true,
            },
        });
        return res.json({
            success: true,
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("UPDATE PROFILE ERROR:", err);
        return res.status(500).json({
            error: "Server error",
        });
    }
}
