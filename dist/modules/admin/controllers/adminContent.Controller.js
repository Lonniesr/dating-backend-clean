"use strict";
// src/controllers/adminContentController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentItem = exports.getContentItems = void 0;
let items = [
    {
        id: "content_1",
        title: "Welcome message",
        type: "copy",
        body: "Welcome to LynQ — where connections feel intentional.",
    },
];
const getContentItems = async (req, res) => {
    res.json({ items });
};
exports.getContentItems = getContentItems;
const createContentItem = async (req, res) => {
    const { title, body } = req.body;
    const item = {
        id: `content_${Date.now()}`,
        title,
        type: "prompt",
        body,
    };
    items = [item, ...items];
    res.json({ items });
};
exports.createContentItem = createContentItem;
