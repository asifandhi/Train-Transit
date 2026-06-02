import { Router } from "express";
import {
  createTrain,
  getAllTrains,
  getTrainById,
  updateTrain,
  deleteTrain,
} from "../controllers/train.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

router.route("/").get(getAllTrains); 
router.route("/").post(verifyJWT, authorizeRoles("admin"), createTrain); 

router.route("/:id").get(getTrainById); 
router.route("/").put(verifyJWT, authorizeRoles("admin"), updateTrain); 
router.route("/").delete(verifyJWT, authorizeRoles("admin"), deleteTrain); 

export default router;
