"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uploadPhoto;
const prisma_1 = __importDefault(require("../../../prisma"));
async function uploadPhoto(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = `/uploads/photos/${req.file.filename}`;
        const count = await prisma_1.default.photo.count({
            where: { userId },
        });
        await prisma_1.default.photo.create({
            data: {
                url: filePath,
                order: count,
                userId,
            },
        });
        const photos = await prisma_1.default.photo.findMany({
            where: { userId },
            orderBy: { order: "asc" },
        });
        return res.json({
            photos: photos.map((p) => p.url),
        });
    }
    catch (err) {
        console.error("UPLOAD PHOTO ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
