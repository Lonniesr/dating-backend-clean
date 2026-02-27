import { Socket } from "socket.io";

export function requireSocketRole(role: string) {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (socket.data.role !== role) {
      return next(new Error("Forbidden"));
    }

    next();
  };
}