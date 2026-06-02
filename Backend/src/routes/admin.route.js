import { Router } from "express";

import {
  getRevenueStats,
  getAllBookings,
  processRefund,
  getReports,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";
const router = Router();

router.use(verifyJWT, authorizeRoles("admin"));

router.route("/bookings").get(getAllBookings);

router.route("/revenue").get(getRevenueStats);

router.route("/refunds/:id").put(processRefund);

router.route("/reports").get(getReports);

export default router;
