"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = reorderPhotos;
const prisma_1 = __importDefault(require("../../../prisma"));
async function reorderPhotos(req, res) {
    try {
        // ✅ Type-safe auth guard
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId = req.user.id;
        const { newOrder } = req.body;
        if (!Array.isArray(newOrder)) {
            return res.status(400).json({ error: "Invalid photo order" });
        }
        const updated = await prisma_1.default.user.update({
            where: { id: userId },
            data: { photos: newOrder },
            select: { photos: true },
        });
        return res.json({ photos: updated.photos });
    }
    catch (err) {
        console.error("REORDER PHOTO ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
