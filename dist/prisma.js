"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const env_1 = require("./config/env");
const prisma = (_a = global.prisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    log: env_1.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
if (env_1.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}
exports.default = prisma;
