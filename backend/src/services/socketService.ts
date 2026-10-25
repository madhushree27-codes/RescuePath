import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

class SocketService {
  private io: SocketIOServer | null = null;

  init(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
      }
    });

    this.io.on("connection", (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on("trip:join", (tripId: string) => {
        socket.join(`trip:${tripId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined room trip:${tripId}`);
      });

      socket.on("trip:leave", (tripId: string) => {
        socket.leave(`trip:${tripId}`);
        console.log(`[Socket.IO] Client ${socket.id} left room trip:${tripId}`);
      });

      socket.on("disconnect", () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });
  }

  emitTripUpdate(tripId: string, trip: any) {
    if (this.io) {
      this.io.to(`trip:${tripId}`).emit("trip:updated", trip);
      this.io.emit("trips:changed", trip);
    }
  }

  emitRerouteAlert(tripId: string, alert: any) {
    if (this.io) {
      this.io.to(`trip:${tripId}`).emit("trip:reroute_alert", alert);
    }
  }

  emitTrafficAlert(tripId: string, trafficData: any) {
    if (this.io) {
      this.io.to(`trip:${tripId}`).emit("trip:traffic_alert", trafficData);
    }
  }

  emitIncidentChange(incident: any) {
    if (this.io) {
      this.io.emit("traffic:incident_updated", incident);
    }
  }
}

export const socketService = new SocketService();
