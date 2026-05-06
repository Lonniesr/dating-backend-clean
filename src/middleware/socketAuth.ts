import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId?: string;
  id?: string;
  role?: string;
}

export function socketAuth() {
  return (socket: Socket, next: (err?: Error) => void) => {
    try {
      const tokenFromAuth =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      let token = tokenFromAuth;

      // 🔥 ADD THIS BLOCK ONLY (cookie fallback)
      if (!token) {
        const cookieHeader = socket.handshake.headers.cookie;

        if (cookieHeader) {
          const cookies = Object.fromEntries(
            cookieHeader.split(";").map((c) => {
              const [k, v] = c.trim().split("=");
              return [k, v];
            })
          );

          token = cookies.token; // 👈 must match your cookie name
        }
      }

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as JwtPayload;

      // ✅ Attach to socket.data (correct pattern)
      socket.data.userId = decoded.userId || decoded.id;
      socket.data.role = decoded.role;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  };
}