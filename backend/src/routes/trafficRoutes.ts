import { Router } from "express";
import { trafficController } from "../controllers/trafficController";

const router = Router();

router.get("/provider-status", trafficController.getProviderStatus);
router.get("/incidents", trafficController.getIncidents);
router.post("/incidents", trafficController.createIncident);
router.delete("/incidents/:id", trafficController.deleteIncident);
router.get("/lane-analysis", trafficController.getLaneAnalysis);

export default router;
