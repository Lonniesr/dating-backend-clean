import { Server } from "socket.io";

import { adminSocket } from "./admin.socket";
import { analyticsSocket } from "./analytics.socket";
import { registerChatSocket } from "./chat.socket";
import { messageSocket } from "./message.socket";

export function registerSockets(io: Server) {
  adminSocket(io);
  analyticsSocket(io);
  registerChatSocket(io);
  messageSocket(io);
}