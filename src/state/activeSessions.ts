export const activeSessions = new Set<string>();

export function addSession(adminId: string) {
  activeSessions.add(adminId);
}

export function removeSession(adminId: string) {
  activeSessions.delete(adminId);
}

export function getActiveSessionCount() {
  return activeSessions.size;
}