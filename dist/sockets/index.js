"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSockets = registerSockets;
const admin_socket_1 = require("./admin.socket");
const analytics_socket_1 = require("./analytics.socket");
const chat_socket_1 = require("./chat.socket");
const message_socket_1 = require("./message.socket");
function registerSockets(io) {
    (0, admin_socket_1.adminSocket)(io);
    (0, analytics_socket_1.analyticsSocket)(io);
    (0, chat_socket_1.registerChatSocket)(io);
    (0, message_socket_1.messageSocket)(io);
}
