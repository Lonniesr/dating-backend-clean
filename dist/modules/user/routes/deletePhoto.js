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
        const photos = await prisma_1.default.photo.findMany({
            where: { userId },
            orderBy: { order: "asc" },
        });
        const target = photos[index];
        if (!target) {
            return res.status(400).json({ error: "Invalid photo index" });
        }
        await prisma_1.default.photo.delete({
            where: { id: target.id },
        });
        const remaining = await prisma_1.default.photo.findMany({
            where: { userId },
            orderBy: { order: "asc" },
        });
        const urls = remaining.map((p) => p.url);
        return res.json({ photos: urls });
    }
    catch (err) {
        console.error("DELETE PHOTO ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
