"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackMessageEvent = trackMessageEvent;
exports.getMessagesPerMinute = getMessagesPerMinute;
let events = [];
function trackMessageEvent() {
    events.push(Date.now());
}
function getMessagesPerMinute() {
    const cutoff = Date.now() - 60000;
    events = events.filter((t) => t > cutoff);
    return events.length;
}
