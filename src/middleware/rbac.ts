export const Roles = {
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const PagePermissions: Record<string, Role[]> = {
  dashboard: [Roles.ADMIN, Roles.SUPERADMIN],
  users: [Roles.ADMIN, Roles.SUPERADMIN],
  invites: [Roles.ADMIN, Roles.SUPERADMIN],
  analytics: [Roles.ADMIN, Roles.SUPERADMIN],
  billing: [Roles.SUPERADMIN],
  logs: [Roles.SUPERADMIN],
  "developer-console": [Roles.SUPERADMIN],
  "system-tasks": [Roles.SUPERADMIN],
  "content-library": [Roles.ADMIN, Roles.SUPERADMIN],
  onboarding: [Roles.ADMIN, Roles.SUPERADMIN],
  "internal-api-keys": [Roles.SUPERADMIN],
  legal: [Roles.SUPERADMIN],
  feedback: [Roles.ADMIN, Roles.SUPERADMIN],
  marketing: [Roles.ADMIN, Roles.SUPERADMIN],
  moderation: [Roles.ADMIN, Roles.SUPERADMIN],
  labs: [Roles.SUPERADMIN],
  "feature-rollouts": [Roles.SUPERADMIN],
  "ml-models": [Roles.SUPERADMIN],
  "developer-settings": [Roles.SUPERADMIN],
};