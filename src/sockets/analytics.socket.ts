import { Server } from "socket.io";

/**
 * Analytics WebSocket
 * Handles real-time analytics events
 */
export function analyticsSocket(io: Server) {
  const analytics = io.of("/analytics");

  analytics.on("connection", (socket) => {
    console.log("📊 Analytics client connected:", socket.id);

    socket.on("page_view", (data) => {
      console.log("📄 Page view:", data);
      analytics.emit("page_view", data);
    });

    socket.on("metric", (metric) => {
      console.log("📈 Metric received:", metric);
      analytics.emit("metric", metric);
    });

    socket.on("disconnect", () => {
      console.log("📉 Analytics client disconnected:", socket.id);
    });
  });
}