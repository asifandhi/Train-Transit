import { Router } from "express";

import {
  validateAndApplyDiscount,
  getDiscountTypes,
} from "../controllers/discount.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.route("/types").get(getDiscountTypes);

router
  .route("/validate")
  .post(verifyJWT, upload.single("proof"), validateAndApplyDiscount);

export default router;
