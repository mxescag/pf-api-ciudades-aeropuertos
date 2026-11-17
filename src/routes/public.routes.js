import { Router } from "express";
import * as ctrl from "../controllers/public.controller.js";

const router = Router();

router.get("/cities", ctrl.searchCities);
router.get("/cities/:id/airports", ctrl.cityAirports);
router.get("/routes/direct", ctrl.searchDirect);

export default router;
