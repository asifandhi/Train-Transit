import { Router } from "express";
import { checkPNRStatus } from "../controllers/pnr.controller.js";

const router = Router();

router.route("/:pnr").get(checkPNRStatus);

export default router;
