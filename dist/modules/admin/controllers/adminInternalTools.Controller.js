"use strict";
// src/controllers/adminInternalToolsController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceMatchForUser = exports.resetUserState = void 0;
const resetUserState = async (req, res) => {
    const { userId } = req.body;
    res.json({ message: `User ${userId} state reset.` });
};
exports.resetUserState = resetUserState;
const forceMatchForUser = async (req, res) => {
    const { userId } = req.body;
    res.json({ message: `Forced match created for user ${userId}.` });
};
exports.forceMatchForUser = forceMatchForUser;
