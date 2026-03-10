"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uploadPhoto;
const prisma_1 = __importDefault(require("../../../prisma"));
/**
 * POST /api/user/photos/upload
 * Save photo URL after it has already been uploaded to storage
 */
async function uploadPhoto(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { url } = req.body;
        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "Invalid photo URL" });
        }
        /**
         * Get current photo count to determine order
         */
        const count = await prisma_1.default.photo.count({
            where: { userId },
        });
        /**
         * Save photo record
         */
        await prisma_1.default.photo.create({
            data: {
                userId,
                url,
                order: count,
            },
        });
        /**
         * Return updated photo list
         */
        const photos = await prisma_1.default.photo.findMany({
            where: { userId },
            orderBy: { order: "asc" },
            select: { url: true },
        });
        return res.json({
            success: true,
            photos: photos.map((p) => p.url),
        });
    }
    catch (err) {
        console.error("UPLOAD PHOTO ERROR:", err);
        return res.status(500).json({
            error: "Failed to save photo",
        });
    }
}
