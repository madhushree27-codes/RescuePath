import express from "express";
import http from "http";
import cors from "cors";
import { config } from "./config/env";
import { socketService } from "./services/socketService";

import tripRoutes from "./routes/tripRoutes";
import hospitalRoutes from "./routes/hospitalRoutes";
import trafficRoutes from "./routes/trafficRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import healthRoutes from "./routes/healthRoutes";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketService.init(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/trips", tripRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/traffic", trafficRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/health", healthRoutes);

app.get("/", (req, res) => {
  res.json({
    project: "RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support",
    version: "1.0.0",
    status: "online",
    endpoints: {
      trips: "/api/trips",
      hospitals: "/api/hospitals",
      traffic: "/api/traffic/incidents",
      analytics: "/api/analytics/summary",
      health: "/api/health"
    }
  });
});

server.listen(config.PORT, () => {
  console.log(`[RescuePath API Gateway] Server listening on http://localhost:${config.PORT}`);
});
