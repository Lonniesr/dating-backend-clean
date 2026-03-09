"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePhotos = savePhotos;
const prisma_1 = __importDefault(require("../../../prisma"));
async function savePhotos(req, res) {
    try {
        const { userId, photos } = req.body;
        if (!userId || !Array.isArray(photos)) {
            return res.status(400).json({
                success: false,
                message: "Missing fields.",
            });
        }
        // delete existing photos
        await prisma_1.default.photo.deleteMany({
            where: { userId },
        });
        // recreate photos
        await prisma_1.default.photo.createMany({
            data: photos.map((url, index) => ({
                url,
                order: index,
                userId,
            })),
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("savePhotos error:", err);
        return res.status(500).json({
            success: false,
        });
    }
}
