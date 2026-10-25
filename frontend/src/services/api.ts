import axios from "axios";
import { ITrip, ICandidateHospital, ILaneAnalysis, ITrafficIncident, IAnalyticsSummary } from "../types";

const API_BASE = "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 8000
});

export const api = {
  // Trips
  async createTrip(payload: {
    emergencyType: string;
    severity: string;
    callerNotes?: string;
    ambulanceLocation: { name: string; lat: number; lng: number };
    patientLocation: { name: string; lat: number; lng: number };
    selectedHospitalId?: string;
  }): Promise<ITrip> {
    const res = await client.post("/trips", payload);
    return res.data.trip;
  },

  async getTrips(): Promise<ITrip[]> {
    const res = await client.get("/trips");
    return res.data.trips || [];
  },

  async getTrip(id: string): Promise<ITrip> {
    const res = await client.get(`/trips/${id}`);
    return res.data.trip;
  },

  async updateTripStatus(id: string, status: string, note?: string): Promise<ITrip> {
    const res = await client.patch(`/trips/${id}/status`, { status, note });
    return res.data.trip;
  },

  async selectHospital(tripId: string, hospitalId: string): Promise<ITrip> {
    const res = await client.patch(`/trips/${tripId}/select-hospital`, { hospitalId });
    return res.data.trip;
  },

  async acceptReroute(tripId: string, rerouteId: string, alternativeRoute: any, timeSavedMinutes: number): Promise<ITrip> {
    const res = await client.post(`/trips/${tripId}/accept-reroute`, {
      rerouteId,
      alternativeRoute,
      timeSavedMinutes
    });
    return res.data.trip;
  },

  async sendTelemetry(tripId: string, lat: number, lng: number, speedKmh: number = 42) {
    const res = await client.post(`/trips/${tripId}/telemetry`, { lat, lng, speedKmh });
    return res.data;
  },

  // Geocoding
  async geocode(query: string): Promise<{ success: boolean; location?: { name: string; lat: number; lng: number }; error?: string }> {
    try {
      const res = await client.get(`/trips/geocode?q=${encodeURIComponent(query)}`);
      return res.data;
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || "Location unavailable"
      };
    }
  },

  // Hospitals
  async getHospitals(refLat?: number, refLng?: number): Promise<ICandidateHospital[]> {
    const params = refLat !== undefined && refLng !== undefined ? `?lat=${refLat}&lng=${refLng}` : "";
    const res = await client.get(`/hospitals${params}`);
    return res.data.hospitals || [];
  },

  // Traffic & Lanes
  async getIncidents(): Promise<ITrafficIncident[]> {
    const res = await client.get("/traffic/incidents");
    return res.data.incidents || [];
  },

  async createIncident(incident: { roadName: string; severity: string; delayFactor: number; description: string; lat?: number; lng?: number }): Promise<ITrafficIncident> {
    const res = await client.post("/traffic/incidents", incident);
    return res.data.incident;
  },

  async deleteIncident(id: string) {
    const res = await client.delete(`/traffic/incidents/${id}`);
    return res.data;
  },

  async getLaneAnalysis(junctionId: string = "JNC-ACTIVE-01", roadName?: string): Promise<ILaneAnalysis> {
    const q = roadName ? `junctionId=${encodeURIComponent(junctionId)}&roadName=${encodeURIComponent(roadName)}` : `junctionId=${encodeURIComponent(junctionId)}`;
    const res = await client.get(`/traffic/lane-analysis?${q}`);
    return res.data;
  },

  async getTrafficProviderStatus(): Promise<{
    configuredProvider: string;
    activeProvider: string;
    isLiveExternal: boolean;
    missingCredentials: string[];
    supportedProviders: string[];
    dataProvenance: string;
  }> {
    const res = await client.get("/traffic/provider-status");
    return res.data;
  },

  // Analytics
  async getAnalyticsSummary(): Promise<{
    summary: IAnalyticsSummary;
    durationVarianceChart: any[];
    emergencyTypesChart: any[];
    bottlenecks: any[];
  }> {
    const res = await client.get("/analytics/summary");
    return res.data;
  },

  // Health
  async getSystemHealth() {
    const res = await client.get("/health");
    return res.data;
  }
};
