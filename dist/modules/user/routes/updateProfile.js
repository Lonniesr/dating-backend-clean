"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateProfile;
const prisma_1 = __importDefault(require("../../../prisma"));
async function updateProfile(req, res) {
    try {
        // ✅ Ensure user exists (Type-safe guard)
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { name, username, birthdate, gender, bio, birthplace, location, } = req.body;
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                name,
                username,
                birthdate: birthdate ? new Date(birthdate) : undefined,
                gender,
                bio,
                birthplace,
                location,
            },
        });
        return res.json({ user: updated });
    }
    catch (err) {
        console.error("UPDATE PROFILE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
