import { Router } from "express";
import {
  cancelBooking,
  getRefundStatus,
} from "../controllers/cancellation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:PNR").post(verifyJWT, cancelBooking);

router.route("/refund/:PNR").get(verifyJWT, getRefundStatus);

export default router;
