import { Router } from "express";
import * as ctrl from "../controllers/airport,controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";

const router = Router();
router.use(authenticate);

router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);
router.post("/", authorizeAdmin, ctrl.create);
router.put("/:id", authorizeAdmin, ctrl.update);

export default router;
