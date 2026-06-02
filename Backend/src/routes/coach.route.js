import { Router } from "express";
import {
  addCoach,
  getCoachesByTrain,
  deleteCoach,
} from "../controllers/coach.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

// Public route
router.get("/:trainId", getCoachesByTrain);

// Admin-only routes
router.post("/", verifyJWT, authorizeRoles("admin"), addCoach);
router.delete("/:id", verifyJWT, authorizeRoles("admin"), deleteCoach);

export default router;
