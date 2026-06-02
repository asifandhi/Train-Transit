import { Router } from "express";

import {
  getAllMeals,
  addMeal,
  addMealToBooking,
} from "../controllers/meal.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

router.route("/").get(getAllMeals);  

router.route("/").post(verifyJWT, authorizeRoles("admin"), addMeal);  

router.route("/booking/:PNR/meals").post(verifyJWT, addMealToBooking);

export default router;
