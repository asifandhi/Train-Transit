import { Router } from "express";
import {
  verifyTicket,
  markNoShow,
  upgradePassenger,
} from "../controllers/tte.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("tte", "admin"));

router.route("/verify/:PNR").get(verifyTicket);

router.route("/noshow/:PNR").put(markNoShow);

router.route("/upgrade/:PNR").put(upgradePassenger);

export default router;
