import { Socket } from "socket.io";

export function requireSocketRole(role: string) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const socketRole = socket.data.role;

    console.log("🛡️ Socket role check:", {
      required: role,
      actual: socketRole,
    });

    if (!socketRole) {
      console.error("❌ No role on socket");
      return next(new Error("Unauthorized"));
    }

    if (socketRole.toLowerCase() !== role.toLowerCase()) {
      console.error("❌ Role mismatch");
      return next(new Error("Forbidden"));
    }

    next();
  };
}