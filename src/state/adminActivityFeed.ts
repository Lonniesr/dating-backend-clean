export const adminActivityFeed: any[] = [];

export function logAdminActivity(event: any) {
  adminActivityFeed.unshift({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...event,
  });

  if (adminActivityFeed.length > 100) {
    adminActivityFeed.pop();
  }
}