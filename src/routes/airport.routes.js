import { Router } from "express";
import * as ctrl from "../controllers/airport.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";

const airportRouter = Router();
airportRouter.use(authenticate);

airportRouter.get("/", ctrl.list);
airportRouter.get("/:id", ctrl.getOne);
airportRouter.post("/", authorizeAdmin, ctrl.create);
airportRouter.put("/:id", authorizeAdmin, ctrl.update);

export default airportRouter;
