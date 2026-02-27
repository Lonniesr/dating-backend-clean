"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deletePhoto;
const prisma_1 = __importDefault(require("../../../prisma"));
async function deletePhoto(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const index = Number(req.params.index);
        if (isNaN(index)) {
            return res.status(400).json({ error: "Invalid photo index" });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { photos: true },
        });
        if (!user || !user.photos[index]) {
            return res.status(400).json({ error: "Invalid photo index" });
        }
        const photos = user.photos;
        const updatedPhotos = photos.filter((_, i) => i !== index);
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: { photos: updatedPhotos },
            select: { photos: true },
        });
        return res.json({ photos: updated.photos });
    }
    catch (err) {
        console.error("DELETE PHOTO ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
