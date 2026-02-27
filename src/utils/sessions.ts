const activeSessions = new Set<string>();

export function addSession(userId: string) {
  activeSessions.add(userId);
}

export function removeSession(userId: string) {
  activeSessions.delete(userId);
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}