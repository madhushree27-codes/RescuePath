import { Request, Response } from "express";
import { localStore } from "../models/LocalStore";
import { routingService } from "../services/routingClient";

export const hospitalController = {
  getHospitals(req: Request, res: Response) {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const hospitals = localStore.getHospitals(lat, lng);
    res.json({ success: true, count: hospitals.length, hospitals });
  },

  getHospitalById(req: Request, res: Response) {
    const hospital = localStore.getHospital(req.params.id);
    if (!hospital) {
      res.status(404).json({ error: "Hospital not found" });
      return;
    }
    res.json({ success: true, hospital });
  },

  async evaluateHospitals(req: Request, res: Response) {
    const { patientLocation, emergencyType = "Cardiac Arrest", severity = "CRITICAL" } = req.body;
    if (!patientLocation || !patientLocation.lat || !patientLocation.lng) {
      res.status(400).json({ error: "patientLocation with lat and lng is required" });
      return;
    }
    const result = await routingService.evaluateHospitals(patientLocation, emergencyType, severity);
    res.json({ success: true, ...result });
  }
};
