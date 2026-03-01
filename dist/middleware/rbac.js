"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagePermissions = exports.Roles = void 0;
exports.Roles = {
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
};
exports.PagePermissions = {
    dashboard: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    users: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    invites: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    analytics: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    billing: [exports.Roles.SUPERADMIN],
    logs: [exports.Roles.SUPERADMIN],
    "developer-console": [exports.Roles.SUPERADMIN],
    "system-tasks": [exports.Roles.SUPERADMIN],
    "content-library": [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    onboarding: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    "internal-api-keys": [exports.Roles.SUPERADMIN],
    legal: [exports.Roles.SUPERADMIN],
    feedback: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    marketing: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    moderation: [exports.Roles.ADMIN, exports.Roles.SUPERADMIN],
    labs: [exports.Roles.SUPERADMIN],
    "feature-rollouts": [exports.Roles.SUPERADMIN],
    "ml-models": [exports.Roles.SUPERADMIN],
    "developer-settings": [exports.Roles.SUPERADMIN],
};
