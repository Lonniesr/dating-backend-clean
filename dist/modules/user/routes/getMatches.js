"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getMatches;
const prisma_1 = __importDefault(require("../../../prisma"));
async function getMatches(req, res) {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const matches = await prisma_1.default.match.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: {
                userA: {
                    select: {
                        id: true,
                        name: true,
                        photos: true,
                        gender: true
                    }
                },
                userB: {
                    select: {
                        id: true,
                        name: true,
                        photos: true,
                        gender: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        const formatted = matches.map((m) => {
            const other = m.userAId === userId ? m.userB : m.userA;
            const photos = Array.isArray(other.photos)
                ? other.photos.map((p) => typeof p === "string" ? p : p === null || p === void 0 ? void 0 : p.url).filter(Boolean)
                : [];
            return {
                id: other.id,
                name: other.name,
                gender: other.gender,
                photos
            };
        });
        return res.json(formatted);
    }
    catch (err) {
        console.error("GET MATCHES ERROR:", err);
        return res.status(500).json({ error: "Server error" });
    }
}
