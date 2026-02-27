"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = editProfile;
const prisma_1 = __importDefault(require("../../../prisma"));
async function editProfile(req, res) {
    try {
        // ✅ Ensure user exists (Type-safe + runtime safe)
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                prompts: true,
                photos: true,
                birthdate: true,
                gender: true,
                location: true,
                birthplace: true,
            },
        });
        return res.json({ user });
    }
    catch (err) {
        console.error("EDIT PROFILE ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
