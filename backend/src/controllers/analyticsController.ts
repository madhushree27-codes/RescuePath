import { Request, Response } from "express";
import { localStore } from "../models/LocalStore";
import { routingService } from "../services/routingClient";

export const analyticsController = {
  async getMetrics(req: Request, res: Response) {
    const allTrips = localStore.listTrips().map((t) => {
      const road1 = t.leg1?.segments?.[0]?.roadName;
      const road2 = t.leg2?.segments?.[0]?.roadName;
      const segment = road1 || road2 || t.patientLocation?.name || "Regional Transit Corridor";

      return {
        tripId: t.id,
        emergencyType: t.emergencyType,
        plannedDurationMinutes: t.metrics?.totalPlannedMinutes || ((t.leg1?.estimatedDurationMinutes || 10) + (t.leg2?.estimatedDurationMinutes || 12)),
        actualDurationMinutes: t.metrics?.totalActualMinutes || ((t.leg1?.estimatedDurationMinutes || 10) + (t.leg2?.estimatedDurationMinutes || 12) + 2.0),
        trafficDelayMinutes: Math.max(0.5, (t.leg1?.trafficDelayMinutes || 0) + (t.leg2?.trafficDelayMinutes || 0)),
        reroutesCount: t.rerouteHistory?.length || 0,
        goldenHourCompliant: t.metrics?.goldenHourCompliant ?? true,
        bottleneckSegment: segment,
        routeEfficiency: t.metrics?.routeEfficiencyScore || 0.92
      };
    });

    const metrics = await routingService.getAnalytics(allTrips);
    res.json({ success: true, ...metrics });
  }
};
