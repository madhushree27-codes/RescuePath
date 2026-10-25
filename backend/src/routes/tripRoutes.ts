import { Router } from "express";
import { tripController } from "../controllers/tripController";

const router = Router();

router.post("/", tripController.createTrip);
router.get("/", tripController.getTrips);
router.get("/geocode", tripController.geocode);
router.post("/geocode", tripController.geocode);
router.get("/:id", tripController.getTripById);
router.patch("/:id/status", tripController.updateTripStatus);
router.patch("/:id/select-hospital", tripController.selectHospital);
router.post("/:id/accept-reroute", tripController.acceptReroute);
router.post("/:id/telemetry", tripController.ingestTelemetry);

export default router;
