"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uploadPhoto;
const prisma_1 = __importDefault(require("../../../prisma"));
async function uploadPhoto(req, res) {
    try {
        // ✅ Type-safe auth guard
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = `/uploads/photos/${req.file.filename}`;
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                photos: {
                    push: filePath,
                },
            },
            select: {
                photos: true,
            },
        });
        return res.json({ photos: updated.photos });
    }
    catch (err) {
        console.error("UPLOAD PHOTO ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
