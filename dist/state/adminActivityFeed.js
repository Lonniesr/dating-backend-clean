"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminActivityFeed = void 0;
exports.logAdminActivity = logAdminActivity;
exports.adminActivityFeed = [];
function logAdminActivity(event) {
    exports.adminActivityFeed.unshift({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...event,
    });
    if (exports.adminActivityFeed.length > 100) {
        exports.adminActivityFeed.pop();
    }
}
