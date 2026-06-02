import { Router } from "express";
import {
  createRoute,
  getRouteByTrain,
  updateRoute,
} from "../controllers/route.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

router.route("/:trainId").get(getRouteByTrain);

router.route("/").post(verifyJWT, authorizeRoles("admin"), createRoute);

router.route("/:id").put(verifyJWT, authorizeRoles("admin"), updateRoute);

export default router;
