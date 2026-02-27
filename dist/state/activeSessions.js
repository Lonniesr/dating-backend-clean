"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeSessions = void 0;
exports.addSession = addSession;
exports.removeSession = removeSession;
exports.getActiveSessionCount = getActiveSessionCount;
exports.activeSessions = new Set();
function addSession(adminId) {
    exports.activeSessions.add(adminId);
}
function removeSession(adminId) {
    exports.activeSessions.delete(adminId);
}
function getActiveSessionCount() {
    return exports.activeSessions.size;
}
