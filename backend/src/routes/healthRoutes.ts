import { Router, Request, Response } from "express";
import axios from "axios";
import { config } from "../config/env";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  let pythonStatus = "OFFLINE";
  try {
    const pyRes = await axios.get(`${config.ROUTING_SERVICE_URL}/health`, { timeout: 10000 });
    if (pyRes.status === 200) pythonStatus = "HEALTHY";
  } catch (err: any) {
    pythonStatus = "DISCONNECTED";
  }

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      apiGateway: "UP",
      socketIo: "ACTIVE",
      routingEnginePython: pythonStatus,
      persistence: "LOCAL_STORE (Active Fallback)"
    }
  });
});

export default router;
