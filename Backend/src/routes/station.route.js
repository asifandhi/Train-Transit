import { Router } from "express";
import {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
} from "../controllers/station.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleGuard.middleware.js";

const router = Router();

router.route("/").get(getAllStations);  
router.route("/").post(verifyJWT, authorizeRoles("admin"), createStation);  

router.route("/:id").get(getStationById); 
router.route("/").put(verifyJWT, authorizeRoles("admin"), updateStation);  

export default router;
