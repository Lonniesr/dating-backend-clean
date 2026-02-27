"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSocketRole = requireSocketRole;
function requireSocketRole(role) {
    return (socket, next) => {
        if (socket.data.role !== role) {
            return next(new Error("Forbidden"));
        }
        next();
    };
}
