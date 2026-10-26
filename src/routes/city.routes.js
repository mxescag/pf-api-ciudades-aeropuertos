import { Router } from "express";
import * as ctrl from "../controllers/city.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";

const cityRouter = Router();
cityRouter.use(authenticate); // todo lo de ciudades exige estar autenticado

cityRouter.get("/", ctrl.list);
cityRouter.get("/with-airports", ctrl.listWithAirports); // ANTES de cualquier /:id
cityRouter.get("/:id/airports", ctrl.listAirports);

cityRouter.post("/", authorizeAdmin, ctrl.create);
cityRouter.put("/:id", authorizeAdmin, ctrl.update);

export default cityRouter;
