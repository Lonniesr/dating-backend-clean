let events: number[] = [];

export function trackMessageEvent() {
  events.push(Date.now());
}

export function getMessagesPerMinute() {
  const cutoff = Date.now() - 60_000;
  events = events.filter((t) => t > cutoff);
  return events.length;
}