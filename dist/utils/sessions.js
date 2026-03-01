"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSession = addSession;
exports.removeSession = removeSession;
exports.getActiveSessionCount = getActiveSessionCount;
const activeSessions = new Set();
function addSession(userId) {
    activeSessions.add(userId);
}
function removeSession(userId) {
    activeSessions.delete(userId);
}
function getActiveSessionCount() {
    return activeSessions.size;
}
