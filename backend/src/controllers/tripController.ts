import { Request, Response } from "express";
import { localStore } from "../models/LocalStore";
import { routingService } from "../services/routingClient";
import { socketService } from "../services/socketService";
import { geocodeAddress } from "../services/geocodingService";
import { ITrip, TripStatus } from "../models/Trip";

export const tripController = {
  async geocode(req: Request, res: Response): Promise<void> {
    const query = (req.query.query as string) || (req.body.query as string) || "";
    const result = await geocodeAddress(query);
    if (!result.success) {
      res.status(404).json({ success: false, error: "Location unavailable" });
      return;
    }
    res.json({ success: true, ...result });
  },

  async createTrip(req: Request, res: Response): Promise<void> {
    try {
      const {
        emergencyType = "Cardiac Arrest",
        severity = "CRITICAL",
        callerNotes = "",
        ambulanceLocation,
        patientLocation,
        selectedHospitalId
      } = req.body;

      if (!ambulanceLocation || !patientLocation) {
        res.status(400).json({ error: "ambulanceLocation and patientLocation are required" });
        return;
      }

      const tripId = `TRIP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Calculate Leg 1: Ambulance -> Patient
      const leg1Result = await routingService.calculateRoute(ambulanceLocation, patientLocation, true);
      const leg1 = {
        ...leg1Result.primaryRoute,
        description: `Leg 1: ${ambulanceLocation.name || "Station"} to Patient at ${patientLocation.name || "Incident"}`
      };

      // 2. Evaluate Candidate Hospitals from Patient Location
      const hospitalEval = await routingService.evaluateHospitals(patientLocation, emergencyType, severity);
      const candidates = hospitalEval.candidateHospitals || [];
      
      let chosenHospital = candidates.find((h) => h.id === selectedHospitalId);
      if (!chosenHospital) {
        chosenHospital = hospitalEval.recommendedHospital || candidates[0];
      }

      // 3. Calculate Leg 2: Patient -> Selected Hospital
      let leg2 = undefined;
      if (chosenHospital) {
        const leg2Result = await routingService.calculateRoute(
          patientLocation,
          { lat: chosenHospital.lat, lng: chosenHospital.lng, name: chosenHospital.name },
          true
        );
        leg2 = {
          ...leg2Result.primaryRoute,
          description: `Leg 2: Patient to ${chosenHospital.name}`
        };
      }

      const now = new Date().toISOString();
      const trip: ITrip = {
        id: tripId,
        createdAt: now,
        emergencyType,
        severity,
        status: "DISPATCHED",
        callerNotes,
        ambulanceLocation,
        patientLocation,
        selectedHospital: chosenHospital,
        leg1,
        leg2,
        candidateHospitals: candidates,
        rerouteHistory: [],
        activeLeg: "LEG1",
        currentLocation: {
          lat: ambulanceLocation.lat,
          lng: ambulanceLocation.lng,
          speedKmh: 42,
          lastUpdated: now
        },
        timestamps: {
          dispatchedAt: now
        },
        metrics: {
          totalPlannedMinutes: (leg1?.estimatedDurationMinutes || 0) + (leg2?.estimatedDurationMinutes || 0),
          totalActualMinutes: 0,
          durationVarianceMinutes: 0,
          routeEfficiencyScore: 1.0,
          goldenHourCompliant: true
        }
      };

      localStore.saveTrip(trip);
      socketService.emitTripUpdate(trip.id, trip);

      res.status(201).json({ success: true, trip });
    } catch (err: any) {
      console.error("Error creating trip:", err);
      res.status(500).json({ error: err.message });
    }
  },

  async getTrips(req: Request, res: Response): Promise<void> {
    const trips = localStore.listTrips();
    res.json({ success: true, count: trips.length, trips });
  },

  async getTripById(req: Request, res: Response): Promise<void> {
    const trip = localStore.getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }
    res.json({ success: true, trip });
  },

  async updateTripStatus(req: Request, res: Response): Promise<void> {
    const { status, note } = req.body;
    const trip = localStore.getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    const now = new Date().toISOString();
    trip.status = status as TripStatus;

    if (status === "EN_ROUTE_TO_PATIENT") {
      trip.activeLeg = "LEG1";
    } else if (status === "AT_PATIENT_LOCATION") {
      trip.timestamps.arrivedAtPatientAt = now;
      trip.activeLeg = "LEG1";
    } else if (status === "EN_ROUTE_TO_HOSPITAL") {
      trip.timestamps.departedPatientAt = now;
      trip.activeLeg = "LEG2";
    } else if (status === "ARRIVED_AT_HOSPITAL") {
      trip.timestamps.arrivedAtHospitalAt = now;
      trip.activeLeg = "LEG2";
    } else if (status === "COMPLETED") {
      trip.timestamps.completedAt = now;
      trip.activeLeg = "COMPLETED";

      // Compute final performance metrics
      const startTime = new Date(trip.timestamps.dispatchedAt).getTime();
      const endTime = new Date(now).getTime();
      const actualMinutes = Math.round(((endTime - startTime) / 60000) * 10) / 10;
      const plannedMinutes = trip.metrics?.totalPlannedMinutes || actualMinutes;
      const variance = Math.round((actualMinutes - plannedMinutes) * 10) / 10;

      trip.metrics = {
        totalPlannedMinutes: plannedMinutes,
        totalActualMinutes: actualMinutes,
        durationVarianceMinutes: variance,
        routeEfficiencyScore: Math.round(Math.min(1.0, plannedMinutes / Math.max(actualMinutes, 1.0)) * 100) / 100,
        goldenHourCompliant: actualMinutes <= 60.0
      };
    }

    localStore.saveTrip(trip);
    socketService.emitTripUpdate(trip.id, trip);
    res.json({ success: true, trip });
  },

  async selectHospital(req: Request, res: Response): Promise<void> {
    const { hospitalId } = req.body;
    const trip = localStore.getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    const hospital = trip.candidateHospitals.find((h) => h.id === hospitalId) || localStore.getHospital(hospitalId);
    if (!hospital) {
      res.status(404).json({ error: "Hospital not found" });
      return;
    }

    trip.selectedHospital = hospital as any;

    // Recalculate Leg 2 from Patient to this hospital
    const leg2Result = await routingService.calculateRoute(
      trip.patientLocation,
      { lat: hospital.lat, lng: hospital.lng, name: hospital.name },
      true
    );
    trip.leg2 = {
      ...leg2Result.primaryRoute,
      description: `Leg 2: Patient to ${hospital.name}`
    };

    localStore.saveTrip(trip);
    socketService.emitTripUpdate(trip.id, trip);
    res.json({ success: true, trip });
  },

  async acceptReroute(req: Request, res: Response): Promise<void> {
    const { rerouteId, alternativeRoute } = req.body;
    const trip = localStore.getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    if (alternativeRoute) {
      if (trip.activeLeg === "LEG1") {
        trip.leg1 = { ...alternativeRoute, description: `Rerouted: ${trip.leg1.description}` };
      } else {
        trip.leg2 = { ...alternativeRoute, description: `Rerouted: ${trip.leg2?.description || "Leg 2"}` };
      }
    }

    trip.rerouteHistory.push({
      rerouteId: rerouteId || `REROUTE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      triggerReason: "Congestion avoidance accepted by driver",
      timeSavedMinutes: req.body.timeSavedMinutes || 3.5,
      previousEtaMinutes: req.body.previousEtaMinutes || 15.0,
      newEtaMinutes: req.body.newEtaMinutes || 11.5,
      acceptedByDriver: true
    });

    localStore.saveTrip(trip);
    socketService.emitTripUpdate(trip.id, trip);
    res.json({ success: true, trip });
  },

  async ingestTelemetry(req: Request, res: Response): Promise<void> {
    const { lat, lng, speedKmh = 40 } = req.body;
    const trip = localStore.getTrip(req.params.id);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    trip.currentLocation = {
      lat,
      lng,
      speedKmh,
      lastUpdated: new Date().toISOString()
    };

    // Evaluate dynamic rerouting
    const activeRoute = trip.activeLeg === "LEG1" ? trip.leg1 : trip.leg2;
    if (activeRoute && activeRoute.pathNodes && activeRoute.pathNodes.length > 1) {
      const destinationNode = activeRoute.pathNodes[activeRoute.pathNodes.length - 1];
      const rerouteCheck = await routingService.checkReroute(lat, lng, activeRoute.pathNodes, destinationNode, 2.5);

      if (rerouteCheck.rerouteRecommended) {
        socketService.emitRerouteAlert(trip.id, {
          tripId: trip.id,
          rerouteId: `REROUTE-${Date.now()}`,
          reason: rerouteCheck.reason,
          timeSavedMinutes: rerouteCheck.timeSavedMinutes,
          alternativeRoute: rerouteCheck.alternativeRoute
        });
      }
    }

    localStore.saveTrip(trip);
    socketService.emitTripUpdate(trip.id, trip);
    res.json({ success: true, currentLocation: trip.currentLocation });
  }
};
