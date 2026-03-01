"use strict";
// src/controllers/adminApiKeysController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeApiKey = exports.createApiKey = exports.getApiKeys = void 0;
const crypto_1 = __importDefault(require("crypto"));
let keys = [];
const getApiKeys = async (req, res) => {
    res.json({ keys });
};
exports.getApiKeys = getApiKeys;
const createApiKey = async (req, res) => {
    const id = `key_${Date.now()}`;
    const raw = crypto_1.default.randomBytes(16).toString("hex");
    const keyPreview = `${raw.slice(0, 4)}••••••${raw.slice(-4)}`;
    const key = {
        id,
        label: `Key ${keys.length + 1}`,
        keyPreview,
        createdAt: new Date().toISOString(),
        revoked: false,
    };
    keys = [key, ...keys];
    res.json({ keys });
};
exports.createApiKey = createApiKey;
const revokeApiKey = async (req, res) => {
    const { id } = req.params;
    keys = keys.map((k) => k.id === id
        ? {
            ...k,
            revoked: true,
        }
        : k);
    res.json({ keys });
};
exports.revokeApiKey = revokeApiKey;
