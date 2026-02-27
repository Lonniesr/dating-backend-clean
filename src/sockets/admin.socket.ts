import { Server, Socket } from "socket.io";
import { socketAuth } from "../middleware/socketAuth";
import { requireSocketRole } from "../middleware/socketRole";

export function adminSocket(io: Server) {
  const nsp = io.of("/admin");

  // 🔐 Centralized middleware
  nsp.use(socketAuth());
  nsp.use(requireSocketRole("ADMIN"));

  nsp.on("connection", (socket: Socket) => {
    const adminId = socket.data.userId as string;

    if (!adminId) {
      socket.disconnect();
      return;
    }

    console.log("🛡️ Admin connected:", socket.id, "admin:", adminId);

    socket.join("admins");

    // ================================
    // ADMIN ONLINE
    // ================================
    nsp.emit("admin:online", { adminId });

    // ================================
    // GLOBAL ALERT
    // ================================
    socket.on("admin:alert", (alert: unknown) => {
      if (
        typeof alert !== "object" ||
        alert === null ||
        !("type" in alert) ||
        !("message" in alert)
      ) {
        return;
      }

      const { type, message } = alert as {
        type: string;
        message: string;
      };

      if (
        typeof type !== "string" ||
        typeof message !== "string" ||
        message.length > 2000
      ) {
        return;
      }

      nsp.to("admins").emit("admin:alert", {
        adminId,
        type,
        message,
        timestamp: Date.now(),
      });
    });

    // ================================
    // TIMELINE EVENT
    // ================================
    socket.on("admin:timeline", (event: unknown) => {
      if (
        typeof event !== "object" ||
        event === null ||
        !("event" in event)
      ) {
        return;
      }

      const { event: eventName, data } = event as {
        event: string;
        data?: unknown;
      };

      if (typeof eventName !== "string") return;

      nsp.to("admins").emit("admin:timeline", {
        adminId,
        event: eventName,
        data: data ?? null,
        timestamp: Date.now(),
      });
    });

    // ================================
    // SESSION UPDATE
    // ================================
    socket.on("admin:session", (session: unknown) => {
      nsp.to("admins").emit("admin:session", {
        adminId,
        session,
        timestamp: Date.now(),
      });
    });

    // ================================
    // DISCONNECT (Redis-safe)
    // ================================
    socket.on("disconnect", async () => {
      console.log("🛡️ Admin disconnected:", socket.id, "admin:", adminId);

      const sockets = await nsp.in("admins").fetchSockets();

      const stillOnline = sockets.some(
        (s) => s.data.userId === adminId
      );

      if (!stillOnline) {
        nsp.emit("admin:offline", { adminId });
      }
    });
  });
}