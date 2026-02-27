"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuth = socketAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function socketAuth() {
    return (socket, next) => {
        var _a, _b;
        try {
            const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) ||
                ((_b = socket.handshake.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]);
            if (!token) {
                return next(new Error("Unauthorized"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // ✅ Attach to socket.data (correct pattern)
            socket.data.userId = decoded.userId || decoded.id;
            socket.data.role = decoded.role;
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    };
}
