import { Router } from "express";
import { hospitalController } from "../controllers/hospitalController";

const router = Router();

router.get("/", hospitalController.getHospitals);
router.get("/:id", hospitalController.getHospitalById);
router.post("/evaluate", hospitalController.evaluateHospitals);

export default router;
