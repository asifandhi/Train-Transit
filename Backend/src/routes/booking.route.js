import { Router } from "express";

import {
  createBooking,
  getMyBookings,
  getBookingByPNR,
} from "../controllers/booking.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

 
router.route("/").post(verifyJWT, authorizeRoles("passenger"), createBooking);
 
router.route("/myBooking").get(verifyJWT, getMyBookings);

router.route("/:PNR").get(verifyJWT, getBookingByPNR);

export default router;
