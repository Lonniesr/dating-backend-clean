"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSocketRole = requireSocketRole;
function requireSocketRole(role) {
    return (socket, next) => {
        const socketRole = socket.data.role;
        console.log("🛡️ Socket role check:", {
            required: role,
            actual: socketRole,
        });
        if (!socketRole) {
            console.error("❌ No role on socket");
            return next(new Error("Unauthorized"));
        }
        if (socketRole.toLowerCase() !== role.toLowerCase()) {
            console.error("❌ Role mismatch");
            return next(new Error("Forbidden"));
        }
        next();
    };
}
