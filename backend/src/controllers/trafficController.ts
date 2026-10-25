import { Request, Response } from "express";
import { localStore } from "../models/LocalStore";
import { routingService } from "../services/routingClient";
import { socketService } from "../services/socketService";
import { externalTrafficService } from "../services/externalTrafficService";
import axios from "axios";
import { config } from "../config/env";

export const trafficController = {
  async getProviderStatus(req: Request, res: Response) {
    const status = await externalTrafficService.getProviderStatus();
    res.json({ success: true, ...status });
  },

  getIncidents(req: Request, res: Response) {
    const incidents = localStore.getIncidents();
    res.json({ success: true, count: incidents.length, incidents });
  },

  async createIncident(req: Request, res: Response) {
    const { roadName, severity = "HEAVY_CONGESTION", delayFactor = 3.0, description = "Traffic jam", lat = 12.9608, lng = 77.6415 } = req.body;
    const incidentId = `INC-${Date.now().toString().slice(-4)}`;
    const incident = {
      id: incidentId,
      roadName,
      severity,
      delayFactor,
      description,
      lat,
      lng,
      active: true,
      reportedAt: new Date().toISOString()
    };

    localStore.addIncident(incident);

    // Forward to Python routing service
    try {
      await axios.post(`${config.ROUTING_SERVICE_URL}/traffic/incidents`, incident);
    } catch (err: any) {
      console.warn("Could not notify Python service of incident:", err.message);
    }

    socketService.emitIncidentChange(incident);
    res.status(201).json({ success: true, incident });
  },

  async deleteIncident(req: Request, res: Response) {
    const { id } = req.params;
    const removed = localStore.removeIncident(id);
    if (!removed) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    try {
      await axios.delete(`${config.ROUTING_SERVICE_URL}/traffic/incidents/${id}`);
    } catch (err: any) {
      console.warn("Could not notify Python service of incident removal:", err.message);
    }

    socketService.emitIncidentChange({ id, active: false });
    res.json({ success: true, message: "Incident cleared" });
  },

  async getLaneAnalysis(req: Request, res: Response) {
    const junctionId = (req.query.junctionId as string) || "JNC-ACTIVE-01";
    const roadName = req.query.roadName as string | undefined;
    const data = await routingService.getLaneAnalysis(junctionId, roadName);
    res.json({ success: true, ...data });
  }
};
