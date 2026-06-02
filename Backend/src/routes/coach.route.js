import { Router } from "express";
import {
  addCoach,
  getCoachesByTrain,
  deleteCoach,
} from "../controllers/coach.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

router.route("/:trainId").get(getCoachesByTrain);

router.route("/").post(verifyJWT, authorizeRoles("admin"), addCoach);

router.route("/:id").delete(verifyJWT, authorizeRoles("admin"), deleteCoach);

export default router;
