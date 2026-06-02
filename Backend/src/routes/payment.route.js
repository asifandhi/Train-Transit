import { Router } from "express";
import {
  initiatePayment,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/initiate").post(verifyJWT, initiatePayment);

router.route("/verify").post(verifyJWT, verifyPayment);

export default router;
